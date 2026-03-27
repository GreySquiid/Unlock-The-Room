using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UnlockTheRoom.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderIndexToLevels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OrderIndex",
                table: "Levels",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrderIndex",
                table: "Levels");
        }
    }
}
