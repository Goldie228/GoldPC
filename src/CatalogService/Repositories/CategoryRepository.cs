using CatalogService.Data;
using CatalogService.Models;
using CatalogService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace CatalogService.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly CatalogDbContext _context;
    private readonly ReadOnlyCatalogDbContext _readContext;

    public CategoryRepository(CatalogDbContext context, ReadOnlyCatalogDbContext readContext)
    {
        _context = context;
        _readContext = readContext;
    }

    public async Task<Category?> GetByIdAsync(Guid id)
    {
        return await _readContext.Categories
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Category?> GetBySlugAsync(string slug)
    {
        return await _readContext.Categories
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Slug == slug);
    }

    public async Task<IEnumerable<CategoryFilterAttribute>> GetFilterAttributesByCategorySlugAsync(string slug)
    {
        var category = await _readContext.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Slug == slug);
        if (category == null)
        {
            return Array.Empty<CategoryFilterAttribute>();
        }

        return await _readContext.CategoryFilterAttributes
            .AsNoTracking()
            .Where(a => a.CategoryId == category.Id)
            .OrderBy(a => a.SortOrder)
            .ToListAsync();
    }

    public async Task<IEnumerable<Category>> GetAllAsync()
    {
        return await _readContext.Categories
            .Include(c => c.Children)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<Category>> GetRootCategoriesAsync()
    {
        return await _readContext.Categories
            .Where(c => c.ParentId == null)
            .Include(c => c.Children)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<Category> CreateAsync(Category category)
    {
        category.Id = Guid.NewGuid();
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task<Category> UpdateAsync(Category category)
    {
        _context.Categories.Update(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task DeleteAsync(Guid id)
    {
        var category = await GetByIdAsync(id);
        if (category != null)
        {
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> HasProductsAsync(Guid id)
    {
        return await _readContext.Products.AnyAsync(p => p.CategoryId == id);
    }
}

public class ManufacturerRepository : IManufacturerRepository
{
    private readonly CatalogDbContext _context;
    private readonly ReadOnlyCatalogDbContext _readContext;

    public ManufacturerRepository(CatalogDbContext context, ReadOnlyCatalogDbContext readContext)
    {
        _context = context;
        _readContext = readContext;
    }

    public async Task<Manufacturer?> GetByIdAsync(Guid id)
    {
        return await _readContext.Manufacturers.FindAsync(id);
    }

    public async Task<Manufacturer?> GetByNameAsync(string name)
    {
        return await _readContext.Manufacturers
            .FirstOrDefaultAsync(m => m.Name == name);
    }

    public async Task<IEnumerable<Manufacturer>> GetAllAsync()
    {
        return await _readContext.Manufacturers
            .OrderBy(m => m.Name)
            .ToListAsync();
    }

    public async Task<Manufacturer> CreateAsync(Manufacturer manufacturer)
    {
        manufacturer.Id = Guid.NewGuid();
        _context.Manufacturers.Add(manufacturer);
        await _context.SaveChangesAsync();
        return manufacturer;
    }

    public async Task<Manufacturer> UpdateAsync(Manufacturer manufacturer)
    {
        _context.Manufacturers.Update(manufacturer);
        await _context.SaveChangesAsync();
        return manufacturer;
    }

    public async Task DeleteAsync(Guid id)
    {
        var manufacturer = await GetByIdAsync(id);
        if (manufacturer != null)
        {
            _context.Manufacturers.Remove(manufacturer);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> HasProductsAsync(Guid id)
    {
        return await _readContext.Products.AnyAsync(p => p.ManufacturerId == id);
    }
}

public class ReviewRepository : IReviewRepository
{
    private readonly CatalogDbContext _context;
    private readonly ReadOnlyCatalogDbContext _readContext;

    public ReviewRepository(CatalogDbContext context, ReadOnlyCatalogDbContext readContext)
    {
        _context = context;
        _readContext = readContext;
    }

    public async Task<Review?> GetByIdAsync(Guid id)
    {
        return await _context.Reviews.FindAsync(id);
    }

    public async Task<IEnumerable<Review>> GetByProductIdAsync(Guid productId)
    {
        return await _context.Reviews
            .Where(r => r.ProductId == productId && r.IsVerified)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Review>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Reviews
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<Review> CreateAsync(Review review)
    {
        review.Id = Guid.NewGuid();
        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();
        return review;
    }

    public async Task DeleteAsync(Guid id)
    {
        var review = await GetByIdAsync(id);
        if (review != null)
        {
            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<double> GetAverageRatingAsync(Guid productId)
    {
        var reviews = await _readContext.Reviews
            .Where(r => r.ProductId == productId && r.IsVerified)
            .Select(r => r.Rating)
            .ToListAsync();

        return reviews.Count > 0 ? reviews.Average() : 0;
    }

    public async Task<int> GetReviewCountAsync(Guid productId)
    {
        return await _readContext.Reviews
            .CountAsync(r => r.ProductId == productId && r.IsVerified);
    }

    public async Task<bool> ExistsByUserAndProductAsync(Guid userId, Guid productId)
    {
        return await _readContext.Reviews
            .AnyAsync(r => r.UserId == userId && r.ProductId == productId);
    }
}