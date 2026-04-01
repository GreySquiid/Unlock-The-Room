using Microsoft.EntityFrameworkCore;
using UnlockTheRoom.API.Models;
using Barrier = UnlockTheRoom.API.Models.Barrier;

namespace UnlockTheRoom.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Level> Levels { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Score> Scores { get; set; }
    public DbSet<SavedLevel> SavedLevels { get; set; }
    public DbSet<GameObject> GameObjects { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<GameObject>()
            .HasDiscriminator<string>("ObjectType")
            .HasValue<Key>("Key")
            .HasValue<Barrier>("Barrier")
            .HasValue<Button>("Button")
            .HasValue<Hazard>("Hazard")
            .HasValue<ExitDoor>("ExitDoor");

        modelBuilder.Entity<GameObject>()
            .HasOne(g => g.Level)
            .WithMany(l => l.GameObjects)
            .HasForeignKey("LevelId")
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Score>()
            .HasOne(s => s.User)
            .WithMany(u => u.Scores)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Score>()
            .HasOne(s => s.Level)
            .WithMany(l => l.Scores)
            .HasForeignKey(s => s.LevelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SavedLevel>()
            .HasOne(sl => sl.User)
            .WithMany(u => u.SavedLevels)
            .HasForeignKey(sl => sl.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SavedLevel>()
            .HasOne(sl => sl.Level)
            .WithMany(l => l.SavedLevels)
            .HasForeignKey(sl => sl.LevelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();
    }
}