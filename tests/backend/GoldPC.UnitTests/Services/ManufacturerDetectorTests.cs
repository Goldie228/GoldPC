using CatalogService.Services;
using Xunit;

namespace GoldPC.UnitTests.Services;

public class ManufacturerDetectorTests
{
    private readonly ManufacturerDetector _detector = new();
    private readonly List<string> _knownManufacturers = new()
    {
        "Intel", "AMD", "ASUS", "MSI", "Gigabyte", "Jabra", "Sennheiser", "Maxsun", "Fractal Design", "Kingston"
    };

    [Theory]
    [InlineData("Офисная гарнитура Jabra Evolve 20 MS Stereo USB-C", "Jabra")]
    [InlineData("Наушники Sennheiser Accentum True Wireless (белый)", "Sennheiser")]
    [InlineData("Материнская плата Maxsun Terminator B650M WiFi Ice", "Maxsun")]
    [InlineData("Видеокарта ASUS TUF Gaming RTX 4070", "ASUS")]
    [InlineData("Процессор Intel Core i5-13600K", "Intel")]
    [InlineData("Корпус Fractal Design North Charcoal Black", "Fractal Design")]
    [InlineData("Блок питания be quiet! Pure Power 12 M", "be quiet!")] // if "be quiet!" is in knownManufacturers
    [InlineData("Игровая мышь Logitech Pro X Superlight 2 DEX (розовый)", "Logitech")]
    public void Detect_ShouldReturnCorrectManufacturer_BasedOnNewRule(string productName, string expected)
    {
        // Add "be quiet!" to known manufacturers for the specific test case
        var currentKnown = new List<string>(_knownManufacturers);
        if (expected == "be quiet!") currentKnown.Add("be quiet!");

        // Act
        var result = _detector.Detect(productName, currentKnown);

        // Assert
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("Наушники Sony WH-1000XM5", "Sony")]
    [InlineData("Клавиатура Logitech G Pro X", "Logitech")]
    [InlineData("Мышь Razer DeathAdder V3", "Razer")]
    [InlineData("HP ProBook 450 G9", "HP")]
    [InlineData("Оперативная память DDR5 Kingston Fury Beast 32GB", "Kingston")]
    [InlineData("SSD накопитель NVMe Samsung 990 PRO 1TB", "Samsung")]
    public void Detect_WithUnknownManufacturer_ShouldReturnFirstEnglishWord(string productName, string expected)
    {
        // Act
        var result = _detector.Detect(productName, _knownManufacturers);

        // Assert
        Assert.Equal(expected, result);
    }

    [Fact]
    public void Detect_EmptyName_ShouldReturnNull()
    {
        // Act
        var result = _detector.Detect("", _knownManufacturers);

        // Assert
        Assert.Null(result);
    }

    [Theory]
    [InlineData("Просто название на русском", null)]
    [InlineData("Товар без бренда", null)]
    [InlineData("Кабель USB-C 1м", null)]
    [InlineData("ОЗУ DDR5 32GB", null)]
    public void Detect_OnlyRussianWords_ShouldReturnNull(string productName, string? expected)
    {
        // Act
        var result = _detector.Detect(productName, _knownManufacturers);

        // Assert
        Assert.Equal(expected, result);
    }
}
