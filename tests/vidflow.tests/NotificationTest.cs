using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;
using System.Runtime.Intrinsics.X86;
using Xunit;
namespace vidflow.tests
{
    public class NotificationTest : IDisposable
    {
        private readonly IWebDriver _driver;
        private readonly WebDriverWait _wait;
        private const string url= "http://localhost:3000";

        public NotificationTest()
        {
           
            _driver = new ChromeDriver();
            _driver.Manage().Window.Maximize();
            _wait = new WebDriverWait(_driver,TimeSpan.FromSeconds(5));
        }
        [Fact]
        public void Notification_Must_Work()
        { 
            _driver.Navigate().GoToUrl(url);
            var loginLink = _wait.Until(ExpectedConditions.ElementToBeClickable(By.CssSelector("a[href='/login']")));
            loginLink.Click();
            Thread.Sleep(2000);
            var email = _wait.Until(ExpectedConditions.ElementToBeClickable(By.Name("email")));
            email.SendKeys("misedmitro@gmail.com");
            Thread.Sleep(1000);
            var password = _driver.FindElement(By.Name("password"));
            password.SendKeys("test123");
            Thread.Sleep(500);
            var submitButton = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[text()='Next']")));
            submitButton.Click();
            Thread.Sleep(1000);
            var notificationBtn = _wait.Until(ExpectedConditions.ElementToBeClickable(By.CssSelector("button[aria-haspopup='menu']:has(svg)")));
            var badge = notificationBtn.FindElement(By.CssSelector("div.bg-\\[\\#cc0000\\]"));
            Assert.True(badge.Displayed, "Червоний індикатор сповіщень не знайдено");
            Thread.Sleep(1000);
            Assert.Equal("1", badge.Text);
            notificationBtn.Click();
            Thread.Sleep(1000);
            _wait.Until(driver => notificationBtn.GetAttribute("data-state") == "open");
        }
       

        public void Dispose() => _driver.Quit();
       
    }
}