using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Youtube.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoTagsAndLanguage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Language",
                table: "Videos",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Videos",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Language",
                table: "Videos");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Videos");
        }
    }
}
