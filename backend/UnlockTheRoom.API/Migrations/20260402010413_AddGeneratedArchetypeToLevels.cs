using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UnlockTheRoom.API.Migrations
{
    /// <inheritdoc />
    public partial class AddGeneratedArchetypeToLevels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GeneratedArchetype",
                table: "Levels",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GeneratedArchetype",
                table: "Levels");
        }
    }
}
