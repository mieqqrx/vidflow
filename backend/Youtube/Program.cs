using Elastic.Clients.Elasticsearch;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using Youtube.Hubs;
using Youtube.Services;
using Youtube.Services.Youtube.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IChannelService, ChannelService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<IS3Service, S3Service>();
builder.Services.AddScoped<IVideoService, VideoService>();
builder.Services.AddScoped<IVideoInteractionService, VideoInteractionService>();
builder.Services.AddScoped<IPlaylistService, PlaylistService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IWatchHistoryService, WatchHistoryService>();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 500_000_000; 
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 500_000_000;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var jwtSettings = builder.Configuration.GetSection("Jwt");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,        
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["Key"]!))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var activeUserId = context.Request.Headers["X-Active-User"].FirstOrDefault();

                if (!string.IsNullOrEmpty(activeUserId) &&
                    context.Request.Cookies.TryGetValue($"token_{activeUserId}", out var token))
                {
                    context.Token = token;
                }
                else
                {
                    var firstSession = context.Request.Cookies
                        .FirstOrDefault(c => c.Key.StartsWith("token_"));
                    if (!firstSession.Equals(default(KeyValuePair<string, string>)))
                    {
                        context.Token = firstSession.Value;
                    }
                }

                return Task.CompletedTask;
            }
        };
    })
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Google:ClientId"]!;
        options.ClientSecret = builder.Configuration["Google:ClientSecret"]!;
    });

var elasticsearchUrl = builder.Configuration["Elasticsearch:Url"] ?? "http://localhost:9200";
var elasticSettings = new ElasticsearchClientSettings(new Uri(elasticsearchUrl))
    .DefaultIndex("videos");

var elasticClient = new ElasticsearchClient(elasticSettings);
builder.Services.AddSingleton(elasticClient);
builder.Services.AddScoped<IElasticsearchService, ElasticsearchService>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddSignalR();
builder.Services.AddScoped<ILiveStreamService, LiveStreamService>();


var app = builder.Build();

app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? "";
    if (path.StartsWith("/http://") || path.StartsWith("/http%3A"))
    {
        try
        {
            var cleanPath = path.Substring(1);
            var uri = new Uri(cleanPath);
            context.Request.Path = uri.AbsolutePath;
        }
        catch { }
    }
    await next();
});

app.MapHub<LiveStreamHub>("/hubs/livestream");

using (var scope = app.Services.CreateScope())
{
    var esService = scope.ServiceProvider.GetRequiredService<IElasticsearchService>();
    await ((ElasticsearchService)esService).EnsureAllIndexesAsync();
}

app.UseSwagger(options => { });
app.UseSwaggerUI();

app.UseCors("DevPolicy");
app.UseWhen(
    context => !context.Request.Path.StartsWithSegments("/api/streams/on-publish") &&
               !context.Request.Path.StartsWithSegments("/api/streams/on-publish-done") &&
               !context.Request.Path.StartsWithSegments("/api/streams/on-record-done"),
    appBuilder => appBuilder.UseHttpsRedirection()
);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();