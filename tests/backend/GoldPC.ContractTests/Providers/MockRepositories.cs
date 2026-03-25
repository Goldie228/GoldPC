using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CatalogService.Models;
using CatalogService.Repositories.Interfaces;

namespace GoldPC.ContractTests.Providers;

public class MockCategoryRepository : ICategoryRepository
{
    private static List<Category> _categories = new();

    public static void SetCategories(List<Category> categories) => _categories = categories;

    public Task<Category?> GetByIdAsync(Guid id) => Task.FromResult(_categories.FirstOrDefault(c => c.Id == id));
    public Task<Category?> GetBySlugAsync(string slug) => Task.FromResult(_categories.FirstOrDefault(c => c.Slug == slug));
    public Task<IEnumerable<CategoryFilterAttribute>> GetFilterAttributesByCategorySlugAsync(string slug) => Task.FromResult(_categories.FirstOrDefault(c => c.Slug == slug)?.FilterAttributes.AsEnumerable() ?? Enumerable.Empty<CategoryFilterAttribute>());
    public Task<IEnumerable<Category>> GetAllAsync() => Task.FromResult(_categories.AsEnumerable());
    public Task<IEnumerable<Category>> GetRootCategoriesAsync() => Task.FromResult(_categories.Where(c => c.ParentId == null));
    public Task<Category> CreateAsync(Category category) { _categories.Add(category); return Task.FromResult(category); }
    public Task<Category> UpdateAsync(Category category) => Task.FromResult(category);
    public Task DeleteAsync(Guid id) => Task.CompletedTask;
    public Task<bool> HasProductsAsync(Guid id) => Task.FromResult(false);
}

public class MockManufacturerRepository : IManufacturerRepository
{
    private static List<Manufacturer> _manufacturers = new();

    public static void SetManufacturers(List<Manufacturer> manufacturers) => _manufacturers = manufacturers;

    public Task<Manufacturer?> GetByIdAsync(Guid id) => Task.FromResult(_manufacturers.FirstOrDefault(m => m.Id == id));
    public Task<Manufacturer?> GetByNameAsync(string name) => Task.FromResult(_manufacturers.FirstOrDefault(m => m.Name == name));
    public Task<IEnumerable<Manufacturer>> GetAllAsync() => Task.FromResult(_manufacturers.AsEnumerable());
    public Task<Manufacturer> CreateAsync(Manufacturer manufacturer) { _manufacturers.Add(manufacturer); return Task.FromResult(manufacturer); }
    public Task<Manufacturer> UpdateAsync(Manufacturer manufacturer) => Task.FromResult(manufacturer);
    public Task DeleteAsync(Guid id) => Task.CompletedTask;
    public Task<bool> HasProductsAsync(Guid id) => Task.FromResult(false);
}

public class MockReviewRepository : IReviewRepository
{
    private static List<Review> _reviews = new();

    public static void SetReviews(List<Review> reviews) => _reviews = reviews;

    public Task<Review?> GetByIdAsync(Guid id) => Task.FromResult(_reviews.FirstOrDefault(r => r.Id == id));
    public Task<IEnumerable<Review>> GetByProductIdAsync(Guid productId) => Task.FromResult(_reviews.Where(r => r.ProductId == productId));
    public Task<IEnumerable<Review>> GetByUserIdAsync(Guid userId) => Task.FromResult(_reviews.Where(r => r.UserId == userId));
    public Task<Review> CreateAsync(Review review) { _reviews.Add(review); return Task.FromResult(review); }
    public Task DeleteAsync(Guid id) => Task.CompletedTask;
    public Task<double> GetAverageRatingAsync(Guid productId) => Task.FromResult(_reviews.Where(r => r.ProductId == productId).Average(r => (double)r.Rating));
    public Task<int> GetReviewCountAsync(Guid productId) => Task.FromResult(_reviews.Count(r => r.ProductId == productId));
    public Task<bool> ExistsByUserAndProductAsync(Guid userId, Guid productId) => Task.FromResult(_reviews.Any(r => r.UserId == userId && r.ProductId == productId));
}
