using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Youtube.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoResolutionUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VideoUrl1080p",
                table: "Videos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl360p",
                table: "Videos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl720p",
                table: "Videos",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VideoUrl1080p",
                table: "Videos");

            migrationBuilder.DropColumn(
                name: "VideoUrl360p",
                table: "Videos");

            migrationBuilder.DropColumn(
                name: "VideoUrl720p",
                table: "Videos");
        }
    }
}
