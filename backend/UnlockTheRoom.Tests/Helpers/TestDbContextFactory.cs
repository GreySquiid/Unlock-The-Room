using Microsoft.EntityFrameworkCore;
using UnlockTheRoom.API.Data;

namespace UnlockTheRoom.Tests.Helpers;

public static class TestDbContextFactory
{
    public static AppDbContext Create(string dbName = "")
    {
        if (string.IsNullOrEmpty(dbName))
            dbName = Guid.NewGuid().ToString();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new AppDbContext(options);
    }
}
