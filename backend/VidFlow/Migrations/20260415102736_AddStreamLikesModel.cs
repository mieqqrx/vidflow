using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VidFlow.Migrations
{
    /// <inheritdoc />
    public partial class AddStreamLikesModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LiveStreamInteraction_LiveStreams_StreamId",
                table: "LiveStreamInteraction");

            migrationBuilder.DropForeignKey(
                name: "FK_LiveStreamInteraction_Users_UserId",
                table: "LiveStreamInteraction");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LiveStreamInteraction",
                table: "LiveStreamInteraction");

            migrationBuilder.RenameTable(
                name: "LiveStreamInteraction",
                newName: "LiveStreamInteractions");

            migrationBuilder.RenameIndex(
                name: "IX_LiveStreamInteraction_UserId",
                table: "LiveStreamInteractions",
                newName: "IX_LiveStreamInteractions_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_LiveStreamInteraction_StreamId",
                table: "LiveStreamInteractions",
                newName: "IX_LiveStreamInteractions_StreamId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LiveStreamInteractions",
                table: "LiveStreamInteractions",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_LiveStreamInteractions_LiveStreams_StreamId",
                table: "LiveStreamInteractions",
                column: "StreamId",
                principalTable: "LiveStreams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LiveStreamInteractions_Users_UserId",
                table: "LiveStreamInteractions",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LiveStreamInteractions_LiveStreams_StreamId",
                table: "LiveStreamInteractions");

            migrationBuilder.DropForeignKey(
                name: "FK_LiveStreamInteractions_Users_UserId",
                table: "LiveStreamInteractions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LiveStreamInteractions",
                table: "LiveStreamInteractions");

            migrationBuilder.RenameTable(
                name: "LiveStreamInteractions",
                newName: "LiveStreamInteraction");

            migrationBuilder.RenameIndex(
                name: "IX_LiveStreamInteractions_UserId",
                table: "LiveStreamInteraction",
                newName: "IX_LiveStreamInteraction_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_LiveStreamInteractions_StreamId",
                table: "LiveStreamInteraction",
                newName: "IX_LiveStreamInteraction_StreamId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LiveStreamInteraction",
                table: "LiveStreamInteraction",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_LiveStreamInteraction_LiveStreams_StreamId",
                table: "LiveStreamInteraction",
                column: "StreamId",
                principalTable: "LiveStreams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LiveStreamInteraction_Users_UserId",
                table: "LiveStreamInteraction",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
