using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UnlockTheRoom.API.Migrations
{
    /// <inheritdoc />
    public partial class AddRotationToGameObjects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Rotation",
                table: "GameObjects",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rotation",
                table: "GameObjects");
        }
    }
}
