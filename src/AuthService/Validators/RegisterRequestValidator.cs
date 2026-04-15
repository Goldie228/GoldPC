// <copyright file="RegisterRequestValidator.cs" company="GoldPC">
// Copyright (c) GoldPC. All rights reserved.
// </copyright>

using FluentValidation;
using GoldPC.SharedKernel.DTOs;

namespace GoldPC.AuthService.Validators;

/// <summary>
/// Валидатор для запроса регистрации пользователя
/// Реализует правила безопасности из раздела 4.2 документа 07-security.md
/// </summary>
public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    /// <summary>
    /// Список заблокированных временных email-доменов
    /// </summary>
    private static readonly string[] BlockedTempDomains =
    {
        "tempmail.com",
        "guerrillamail.com",
        "mailinator.com",
        "10minutemail.com",
        "throwaway.email",
        "fakeinbox.com",
        "temp-mail.org",
        "disposablemail.com",
        "maildrop.cc",
        "getairmail.com",
        "yopmail.com",
        "sharklasers.com",
        "guerrillamailblock.com",
        "pokemail.net",
        "spam4.me",
        "grr.la",
        "guerrillamail.de",
        "guerrillamail.net",
        "guerrillamail.biz",
        "guerrillamail.org"
    };

    /// <summary>
    /// Список распространённых паролей
    /// </summary>
    private static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "password", "password1", "password123", "password1234", "password12345",
        "123456", "1234567", "12345678", "123456789", "1234567890",
        "qwerty", "qwerty123", "qwertyuiop",
        "admin", "admin123", "administrator",
        "letmein", "welcome", "welcome1",
        "monkey", "dragon", "master", "login",
        "abc123", "trustno1", "iloveyou",
        "sunshine", "princess", "football",
        "passw0rd", "shadow", "michael",
        "baseball", "superman", "batman",
        "starwars", "whatever", "qazwsx",
        "111111", "000000", "654321",
        "password!", "qwe123", "1q2w3e4r"
    };

    public RegisterRequestValidator()
    {
        // === EMAIL VALIDATION ===
        RuleFor(x => x.Email)
            .NotEmpty()
                .WithMessage("Email обязателен")
            .EmailAddress()
                .WithMessage("Некорректный формат email")
            .MaximumLength(255)
                .WithMessage("Email не может превышать 255 символов")
            .Must(BeValidDomain)
                .WithMessage("Регистрация с временных email-адресов запрещена. Используйте постоянный email.");

        // === PASSWORD VALIDATION ===
        RuleFor(x => x.Password)
            .NotEmpty()
                .WithMessage("Пароль обязателен")
            .MinimumLength(8)
                .WithMessage("Пароль должен содержать минимум 8 символов")
            .MaximumLength(128)
                .WithMessage("Пароль не может превышать 128 символов")
            .Matches(@"[A-Z]")
                .WithMessage("Пароль должен содержать минимум одну заглавную букву (A-Z)")
            .Matches(@"[a-z]")
                .WithMessage("Пароль должен содержать минимум одну строчную букву (a-z)")
            .Matches(@"[0-9]")
                .WithMessage("Пароль должен содержать минимум одну цифру (0-9)")
            .Matches(@"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>/?]")
                .WithMessage("Пароль должен содержать минимум один специальный символ (!@#$%^&* и т.д.)")
            .Must(NotBeCommonPassword)
                .WithMessage("Пароль слишком распространённый. Выберите более надёжный пароль.")
            .Must(NotContainUserInfo)
                .WithMessage("Пароль не должен содержать email, имя или фамилию");

        // === FIRST NAME VALIDATION ===
        RuleFor(x => x.FirstName)
            .NotEmpty()
                .WithMessage("Имя обязательно")
            .MinimumLength(2)
                .WithMessage("Имя должно содержать минимум 2 символа")
            .MaximumLength(100)
                .WithMessage("Имя не может превышать 100 символов")
            .Matches(@"^[a-zA-Zа-яА-ЯёЁ\s\-'`]+$")
                .WithMessage("Имя может содержать только буквы, пробелы, дефисы и апострофы");

        // === LAST NAME VALIDATION ===
        RuleFor(x => x.LastName)
            .MinimumLength(2)
                .WithMessage("Фамилия должна содержать минимум 2 символа")
            .MaximumLength(100)
                .WithMessage("Фамилия не может превышать 100 символов")
            .Matches(@"^[a-zA-Zа-яА-ЯёЁ\s\-'`]+$")
                .WithMessage("Фамилия может содержать только буквы, пробелы, дефисы и апострофы")
            .When(x => !string.IsNullOrWhiteSpace(x.LastName));

        // === PHONE VALIDATION (Belarus Format) ===
        RuleFor(x => x.Phone)
            .NotEmpty()
                .WithMessage("Телефон обязателен")
            .Matches(@"^\+375\s?\(?\d{2}\)?\s?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$")
                .WithMessage("Телефон должен быть в формате Беларуси: +375 (XX) XXX-XX-XX");
    }

    /// <summary>
    /// Проверяет, что email-домен не является временным
    /// </summary>
    /// <param name="email">Email адрес</param>
    /// <returns>true если домен разрешён, false если временный</returns>
    private static bool BeValidDomain(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        var parts = email.Split('@');
        if (parts.Length != 2)
        {
            return false;
        }

        var domain = parts[1].ToLowerInvariant().Trim();

        // Проверяем прямое совпадение
        if (BlockedTempDomains.Contains(domain))
        {
            return false;
        }

        // Проверяем поддомены заблокированных доменов
        foreach (var blockedDomain in BlockedTempDomains)
        {
            if (domain.EndsWith("." + blockedDomain, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        return true;
    }

    /// <summary>
    /// Проверяет, что пароль не является распространённым
    /// </summary>
    /// <param name="password">Пароль</param>
    /// <returns>true если пароль не в списке распространённых</returns>
    private static bool NotBeCommonPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            return false;
        }

        // Прямая проверка
        if (CommonPasswords.Contains(password))
        {
            return false;
        }

        // Проверка с исключением цифр в конце (password -> password1)
        var basePassword = System.Text.RegularExpressions.Regex.Replace(password, @"\d+$", "");
        if (!string.IsNullOrEmpty(basePassword) && CommonPasswords.Contains(basePassword))
        {
            return false;
        }

        // Проверка расстояния Левенштейна для коротких паролей
        if (password.Length <= 12)
        {
            foreach (var commonPassword in CommonPasswords)
            {
                if (LevenshteinDistance(password.ToLowerInvariant(), commonPassword) <= 2)
                {
                    return false;
                }
            }
        }

        return true;
    }

    /// <summary>
    /// Проверяет, что пароль не содержит информацию о пользователе
    /// </summary>
    /// <param name="password">Пароль</param>
    /// <param name="context">Контекст валидации с доступом к модели</param>
    /// <returns>true если пароль безопасен</returns>
    private bool NotContainUserInfo(RegisterRequest request, string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            return true;
        }

        var lowerPassword = password.ToLowerInvariant();

        // Проверяем, что пароль не содержит email
        var emailParts = request.Email.Split('@');
        if (emailParts.Length > 0 && lowerPassword.Contains(emailParts[0].ToLowerInvariant()))
        {
            return false;
        }

        // Проверяем, что пароль не содержит имя
        if (!string.IsNullOrWhiteSpace(request.FirstName) && 
            lowerPassword.Contains(request.FirstName.ToLowerInvariant()))
        {
            return false;
        }

        // Проверяем, что пароль не содержит фамилию
        if (!string.IsNullOrWhiteSpace(request.LastName) &&
            lowerPassword.Contains(request.LastName.ToLowerInvariant()))
        {
            return false;
        }

        return true;
    }

    /// <summary>
    /// Вычисляет расстояние Левенштейна между двумя строками
    /// Используется для определения похожести паролей на распространённые
    /// </summary>
    /// <param name="source">Первая строка</param>
    /// <param name="target">Вторая строка</param>
    /// <returns>Расстояние Левенштейна</returns>
    private static int LevenshteinDistance(string source, string target)
    {
        if (string.IsNullOrEmpty(source))
        {
            return string.IsNullOrEmpty(target) ? 0 : target.Length;
        }

        if (string.IsNullOrEmpty(target))
        {
            return source.Length;
        }

        var m = source.Length;
        var n = target.Length;

        // Оптимизация для разницы в длине более 2
        if (Math.Abs(m - n) > 2)
        {
            return 3;
        }

        var dp = new int[m + 1, n + 1];

        for (var i = 0; i <= m; i++)
        {
            dp[i, 0] = i;
        }

        for (var j = 0; j <= n; j++)
        {
            dp[0, j] = j;
        }

        for (var i = 1; i <= m; i++)
        {
            for (var j = 1; j <= n; j++)
            {
                var cost = source[i - 1] == target[j - 1] ? 0 : 1;
                dp[i, j] = Math.Min(
                    Math.Min(dp[i - 1, j] + 1, dp[i, j - 1] + 1),
                    dp[i - 1, j - 1] + cost);
            }
        }

        return dp[m, n];
    }
}
