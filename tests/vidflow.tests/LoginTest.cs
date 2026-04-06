using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;
using Xunit;
namespace vidflow.tests
{

    public class LoginTest : IDisposable
    {
        private readonly IWebDriver _driver;
        private readonly WebDriverWait _wait;
        private const string url= "http://localhost:3000";
        public LoginTest()
        {
           
            _driver = new ChromeDriver();
            _driver.Manage().Window.Maximize();
            _wait = new WebDriverWait(_driver,TimeSpan.FromSeconds(5));
        }
        [Fact]
        public void Login_Existed_User()
        { 
            _driver.Navigate().GoToUrl(url);
            var loginLink = _wait.Until(ExpectedConditions.ElementToBeClickable(By.CssSelector("a[href='/login']")));
            loginLink.Click();
            Thread.Sleep(2000);
            var email = _wait.Until(ExpectedConditions.ElementToBeClickable(By.Name("email")));
            email.SendKeys("test@gmail.com");
            Thread.Sleep(1000);
            var password = _driver.FindElement(By.Name("password"));
            password.SendKeys("StrongPass123!");
            Thread.Sleep(500);
            var submitButton = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[text()='Next']")));
            submitButton.Click();
            Thread.Sleep(1000);
            _wait.Until(ExpectedConditions.UrlContains("/"));
            Assert.Contains("/", _driver.Url);
        }
        [Fact]
        public void Error_With_Invalid_Login()
        {
            _driver.Navigate().GoToUrl($"{url}/login");
            _wait.Until(ExpectedConditions.ElementIsVisible(By.Name("email"))).SendKeys("test@gmail.com");
            _driver.FindElement(By.Name("password")).SendKeys("wrong_password");
            var submitButton = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[text()='Next']")));
            submitButton.Click();
            var errorText=_wait.Until(ExpectedConditions.ElementIsVisible(By.XPath("//div[contains(text(), 'Invalid email or password')]")));
            Thread.Sleep(2000);
            Assert.True(errorText.Displayed);
            string classes = errorText.GetAttribute("class");
            Assert.Contains("bg-red", classes);
            Assert.Equal("Invalid email or password", errorText.Text);
        }
        public void Dispose() => _driver.Quit();
       
    }
}