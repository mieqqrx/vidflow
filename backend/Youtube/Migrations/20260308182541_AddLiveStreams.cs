using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Youtube.Migrations
{
    /// <inheritdoc />
    public partial class AddLiveStreams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LiveStreams",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ThumbnailUrl = table.Column<string>(type: "text", nullable: true),
                    StreamKey = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    PlaybackUrl = table.Column<string>(type: "text", nullable: true),
                    RecordingUrl = table.Column<string>(type: "text", nullable: true),
                    ViewersCount = table.Column<int>(type: "integer", nullable: false),
                    PeakViewersCount = table.Column<int>(type: "integer", nullable: false),
                    TotalViewsCount = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SaveRecording = table.Column<bool>(type: "boolean", nullable: false),
                    ChatEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    ChannelId = table.Column<Guid>(type: "uuid", nullable: false),
                    VideoId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LiveStreams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LiveStreams_Channels_ChannelId",
                        column: x => x.ChannelId,
                        principalTable: "Channels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LiveStreams_Videos_VideoId",
                        column: x => x.VideoId,
                        principalTable: "Videos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "LiveStreamMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StreamId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LiveStreamMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LiveStreamMessages_LiveStreams_StreamId",
                        column: x => x.StreamId,
                        principalTable: "LiveStreams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LiveStreamMessages_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LiveStreamMessages_StreamId",
                table: "LiveStreamMessages",
                column: "StreamId");

            migrationBuilder.CreateIndex(
                name: "IX_LiveStreamMessages_UserId",
                table: "LiveStreamMessages",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_LiveStreams_ChannelId",
                table: "LiveStreams",
                column: "ChannelId");

            migrationBuilder.CreateIndex(
                name: "IX_LiveStreams_VideoId",
                table: "LiveStreams",
                column: "VideoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LiveStreamMessages");

            migrationBuilder.DropTable(
                name: "LiveStreams");
        }
    }
}
