using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Youtube.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoChannelNameToPlaylistVideo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Videos_Channels_ChannelId1",
                table: "Videos");

            migrationBuilder.DropIndex(
                name: "IX_Videos_ChannelId1",
                table: "Videos");

            migrationBuilder.DropColumn(
                name: "ChannelId1",
                table: "Videos");

            migrationBuilder.AddColumn<string>(
                name: "VideoChannelName",
                table: "PlaylistVideos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VideoChannelName",
                table: "PlaylistVideos");

            migrationBuilder.AddColumn<Guid>(
                name: "ChannelId1",
                table: "Videos",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Videos_ChannelId1",
                table: "Videos",
                column: "ChannelId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Videos_Channels_ChannelId1",
                table: "Videos",
                column: "ChannelId1",
                principalTable: "Channels",
                principalColumn: "Id");
        }
    }
}
