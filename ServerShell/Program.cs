
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseWelcomePage();
app.Run(async (context) =>
{
    var response = context.Response;
    response.Headers.ContentLanguage = "ru-RU";
    response.Headers.ContentType = "text/plain; charset=utf-8";
    // response.ContentType = "text/html; charset=utf-8";
    response.Headers.Append("secret-id", "256");
    // await response.WriteAsync("<h2>Hello METANIT.COM</h2><h3>Welcome to ASP.NET Core</h3>");
    await response.WriteAsync("Привет METANIT.COM");
});
app.Run();
