using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;
using System.Runtime.Intrinsics.X86;
using Xunit;
namespace vidflow.tests
{
    public class RegistrationTest : IDisposable
    {
        private readonly IWebDriver _driver;
        private readonly WebDriverWait _wait;
        private const string url= "http://localhost:3000";

        public RegistrationTest()
        {
           
            _driver = new ChromeDriver();
            _driver.Manage().Window.Maximize();
            _wait = new WebDriverWait(_driver,TimeSpan.FromSeconds(5));
        }
        [Fact]
        public void Register_New_User()
        { 
            _driver.Navigate().GoToUrl(url);
            var loginLink = _wait.Until(ExpectedConditions.ElementToBeClickable(By.CssSelector("a[href='/login']")));
            loginLink.Click();
            Thread.Sleep(2000);

             var registerLink= _driver.FindElement(By.CssSelector("a[href='/register']"));
            registerLink.Click();
            Thread.Sleep(2500);

            var userName= _driver.FindElement(By.Name("username"));
            userName.SendKeys("test_user1234");
            Thread.Sleep(1000);

            var dob = _driver.FindElement(By.Name("dateOfBirth"));
            dob.SendKeys("05052000");
            Thread.Sleep(1000);

            var email = _driver.FindElement(By.Name("email"));
            email.SendKeys("test123@gmail.com");
            Thread.Sleep(1000);

            var password = _driver.FindElement(By.Name("password"));
            password.SendKeys("StrongPass123!");
            Thread.Sleep(500);

            var confirmPassword = _driver.FindElement(By.Name("confirmPassword"));
            confirmPassword.SendKeys("StrongPass123!");
            Thread.Sleep(500);

            var submitButton = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[text()='Next']")));
            submitButton.Click();
            Thread.Sleep(1000);

            _wait.Until(ExpectedConditions.UrlContains("/login"));
            Assert.Contains("/login",_driver.Url);
        }
        [Fact]
        public void Error_With_Existing_Email()
        {
            _driver.Navigate().GoToUrl($"{url}/register");
            _wait.Until(ExpectedConditions.ElementIsVisible(By.Name("username"))).SendKeys("another_user");
            var dob = _driver.FindElement(By.Name("dateOfBirth"));
            dob.SendKeys("05052000");
            Thread.Sleep(1000);
            _driver.FindElement(By.Name("email")).SendKeys("test@gmail.com");
            _driver.FindElement(By.Name("password")).SendKeys("Password123!");
            _driver.FindElement(By.Name("confirmPassword")).SendKeys("Password123!");
            var submitButton = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[text()='Next']")));
            Thread.Sleep(2000);

            submitButton.Click();
            _wait.Until(ExpectedConditions.AlertIsPresent());
            IAlert alert = _driver.SwitchTo().Alert();
            Thread.Sleep(2000);
            string alertText = alert.Text;
            Assert.Contains("Email already in use", alertText);
            alert.Accept();
        }

        public void Dispose() => _driver.Quit();
       
    }
}