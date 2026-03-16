using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Youtube.Migrations
{
    /// <inheritdoc />
    public partial class MakeCategoryOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Videos_Categories_CategoryId",
                table: "Videos");

            migrationBuilder.AlterColumn<Guid>(
                name: "CategoryId",
                table: "Videos",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "IconUrl", "Name", "Slug" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000001"), null, "Gaming", "gaming" },
                    { new Guid("00000000-0000-0000-0000-000000000002"), null, "Music", "music" },
                    { new Guid("00000000-0000-0000-0000-000000000003"), null, "Education", "education" },
                    { new Guid("00000000-0000-0000-0000-000000000004"), null, "Entertainment", "entertainment" },
                    { new Guid("00000000-0000-0000-0000-000000000005"), null, "Sports", "sports" }
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Videos_Categories_CategoryId",
                table: "Videos",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Videos_Categories_CategoryId",
                table: "Videos");

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000002"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000003"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000004"));

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000005"));

            migrationBuilder.AlterColumn<Guid>(
                name: "CategoryId",
                table: "Videos",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Videos_Categories_CategoryId",
                table: "Videos",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
