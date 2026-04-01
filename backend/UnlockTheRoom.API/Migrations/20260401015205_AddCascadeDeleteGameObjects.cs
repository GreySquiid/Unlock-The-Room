using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UnlockTheRoom.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCascadeDeleteGameObjects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GameObjects_Levels_LevelId",
                table: "GameObjects");

            migrationBuilder.AddForeignKey(
                name: "FK_GameObjects_Levels_LevelId",
                table: "GameObjects",
                column: "LevelId",
                principalTable: "Levels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GameObjects_Levels_LevelId",
                table: "GameObjects");

            migrationBuilder.AddForeignKey(
                name: "FK_GameObjects_Levels_LevelId",
                table: "GameObjects",
                column: "LevelId",
                principalTable: "Levels",
                principalColumn: "Id");
        }
    }
}
