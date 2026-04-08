using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VidFlow.Migrations
{
    /// <inheritdoc />
    public partial class AddReportsAndRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Role",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "VideoReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReporterId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetVideoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Reason = table.Column<int>(type: "integer", nullable: false),
                    Details = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ModeratorNote = table.Column<string>(type: "text", nullable: true),
                    ReviewedByModeratorId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VideoReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VideoReports_Users_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VideoReports_Videos_TargetVideoId",
                        column: x => x.TargetVideoId,
                        principalTable: "Videos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VideoReports_ReporterId_TargetVideoId",
                table: "VideoReports",
                columns: new[] { "ReporterId", "TargetVideoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VideoReports_TargetVideoId",
                table: "VideoReports",
                column: "TargetVideoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VideoReports");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");
        }
    }
}
