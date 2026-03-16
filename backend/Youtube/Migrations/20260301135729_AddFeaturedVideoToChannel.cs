using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Youtube.Migrations
{
    /// <inheritdoc />
    public partial class AddFeaturedVideoToChannel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FeaturedVideoId",
                table: "Channels",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Channels_FeaturedVideoId",
                table: "Channels",
                column: "FeaturedVideoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Channels_Videos_FeaturedVideoId",
                table: "Channels",
                column: "FeaturedVideoId",
                principalTable: "Videos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Channels_Videos_FeaturedVideoId",
                table: "Channels");

            migrationBuilder.DropIndex(
                name: "IX_Channels_FeaturedVideoId",
                table: "Channels");

            migrationBuilder.DropColumn(
                name: "FeaturedVideoId",
                table: "Channels");
        }
    }
}
