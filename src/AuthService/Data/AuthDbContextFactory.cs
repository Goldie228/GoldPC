using GoldPC.AuthService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GoldPC.AuthService.Data
{
    public class AuthDbContextFactory : IDesignTimeDbContextFactory<AuthDbContext>
    {
        public AuthDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AuthDbContext>();
            optionsBuilder.UseNpgsql("Server=localhost;Port=5434;Database=goldpc_auth;User Id=postgres;Password=admin");
            return new AuthDbContext(optionsBuilder.Options);
        }
    }
}