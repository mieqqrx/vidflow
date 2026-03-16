using Microsoft.EntityFrameworkCore;
using Youtube.Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Channel> Channels { get; set; }
    public DbSet<Subscription> Subscriptions { get; set; }
    public DbSet<Video> Videos { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<VideoLike> VideoLikes { get; set; }
    public DbSet<VideoView> VideoViews { get; set; }
    public DbSet<VideoDislike> VideoDisLikes { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<CommentLike> CommentLikes { get; set; }
    public DbSet<Playlist> Playlists { get; set; }
    public DbSet<PlaylistVideo> PlaylistVideos { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<WatchHistory> WatchHistories { get; set; }
    public DbSet<VideoStatistics> VideoStatistics { get; set; }
    public DbSet<VideoReport> VideoReports { get; set; }
    public DbSet<LiveStream> LiveStreams { get; set; }
    public DbSet<LiveStreamMessage> LiveStreamMessages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasOne(u => u.Channel)
            .WithOne(c => c.Owner)
            .HasForeignKey<Channel>(c => c.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Subscription>()
            .HasIndex(s => new { s.UserId, s.ChannelId })
            .IsUnique();

        modelBuilder.Entity<Subscription>()
            .HasOne(s => s.User)
            .WithMany(u => u.Subscriptions)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Subscription>()
            .HasOne(s => s.Channel)
            .WithMany(c => c.Subscriptions)
            .HasForeignKey(s => s.ChannelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Video>()
            .Property(v => v.Resolutions)
            .HasColumnType("jsonb");

        modelBuilder.Entity<Video>()
            .HasOne(v => v.Channel)
            .WithMany(c => c.Videos)
            .HasForeignKey(v => v.ChannelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Video>()
            .HasOne(v => v.Category)
            .WithMany(c => c.Videos)
            .HasForeignKey(v => v.CategoryId)
            .IsRequired(false) 
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Video>()
            .Property(v => v.Tags)
            .HasColumnType("jsonb");

        modelBuilder.Entity<Category>()
            .HasIndex(c => c.Slug)
            .IsUnique();

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Name = "Gaming", Slug = "gaming" },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Name = "Music", Slug = "music" },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000003"), Name = "Education", Slug = "education" },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000004"), Name = "Entertainment", Slug = "entertainment" },
            new Category { Id = Guid.Parse("00000000-0000-0000-0000-000000000005"), Name = "Sports", Slug = "sports" }
        );

        modelBuilder.Entity<VideoLike>()
            .HasIndex(vl => new { vl.UserId, vl.VideoId })
            .IsUnique();

        modelBuilder.Entity<VideoLike>()
            .HasOne(vl => vl.User)
            .WithMany()
            .HasForeignKey(vl => vl.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VideoLike>()
            .HasOne(vl => vl.Video)
            .WithMany(v => v.Likes)
            .HasForeignKey(vl => vl.VideoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VideoView>()
            .HasOne(vv => vv.Video)
            .WithMany(v => v.Views)
            .HasForeignKey(vv => vv.VideoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VideoView>()
            .HasOne(vv => vv.User)
            .WithMany()
            .HasForeignKey(vv => vv.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<VideoDislike>()
            .HasIndex(vd => new { vd.UserId, vd.VideoId })
            .IsUnique();

        modelBuilder.Entity<VideoDislike>()
            .HasOne(vd => vd.User)
            .WithMany()
            .HasForeignKey(vd => vd.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VideoDislike>()
            .HasOne(vd => vd.Video)
            .WithMany(v => v.Dislikes)
            .HasForeignKey(vd => vd.VideoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.Video)
            .WithMany()
            .HasForeignKey(c => c.VideoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.ParentComment)
            .WithMany(c => c.Replies)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CommentLike>()
            .HasIndex(cl => new { cl.UserId, cl.CommentId })
            .IsUnique(); 

        modelBuilder.Entity<CommentLike>()
            .HasOne(cl => cl.User)
            .WithMany()
            .HasForeignKey(cl => cl.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CommentLike>()
            .HasOne(cl => cl.Comment)
            .WithMany(c => c.Likes)
            .HasForeignKey(cl => cl.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Playlist>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlaylistVideo>()
            .HasOne(pv => pv.Playlist)
            .WithMany(p => p.PlaylistVideos)
            .HasForeignKey(pv => pv.PlaylistId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PlaylistVideo>()
            .HasOne(pv => pv.Video)
            .WithMany()
            .HasForeignKey(pv => pv.VideoId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<PlaylistVideo>()
            .HasIndex(pv => new { pv.PlaylistId, pv.VideoId })
            .IsUnique()
            .HasFilter("\"VideoId\" IS NOT NULL");

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Video)
            .WithMany()
            .HasForeignKey(n => n.VideoId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Comment)
            .WithMany()
            .HasForeignKey(n => n.CommentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Channel)
            .WithMany()
            .HasForeignKey(n => n.ChannelId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Channel>()
            .HasOne(c => c.FeaturedVideo)
            .WithMany()
            .HasForeignKey(c => c.FeaturedVideoId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<WatchHistory>()
            .HasOne(wh => wh.User)
            .WithMany()
            .HasForeignKey(wh => wh.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WatchHistory>()
            .HasOne(wh => wh.Video)
            .WithMany()
            .HasForeignKey(wh => wh.VideoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WatchHistory>()
            .HasIndex(wh => new { wh.UserId, wh.VideoId })
            .IsUnique();

        modelBuilder.Entity<VideoStatistics>()
            .HasOne(vs => vs.Video)
            .WithMany()
            .HasForeignKey(vs => vs.VideoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VideoReport>()
            .HasOne(vr => vr.Reporter)
            .WithMany()
            .HasForeignKey(vr => vr.ReporterId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VideoReport>()
            .HasOne(vr => vr.TargetVideo)
            .WithMany()
            .HasForeignKey(vr => vr.TargetVideoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<VideoReport>()
            .HasIndex(vr => new { vr.ReporterId, vr.TargetVideoId })
            .IsUnique();
    }
}