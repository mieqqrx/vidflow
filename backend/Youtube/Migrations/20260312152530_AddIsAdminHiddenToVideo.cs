using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Youtube.Migrations
{
    /// <inheritdoc />
    public partial class AddIsAdminHiddenToVideo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAdminHidden",
                table: "Videos",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAdminHidden",
                table: "Videos");
        }
    }
}
