using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;
using System.Runtime.Intrinsics.X86;
using Xunit;
namespace vidflow.tests
{
    public class WatchHistoryTest : IDisposable
    {
        private readonly IWebDriver _driver;
        private readonly WebDriverWait _wait;
        private const string url= "http://localhost:3000";

        public WatchHistoryTest()
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
            string videoTitle = "123";
            Thread.Sleep(3000);
            _driver.Navigate().GoToUrl($"{url}/");
            var videoLink = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath($"//h3[text()='{videoTitle}']/ancestor::a")));
            videoLink.Click();
            Thread.Sleep(1000);
            _driver.Navigate().GoToUrl($"{url}/history");
            var historyItemXPath = $"//h3[text()='{videoTitle}']/ancestor::div[contains(@class, 'group')]";
            var historyItem = _wait.Until(ExpectedConditions.ElementIsVisible(By.XPath(historyItemXPath)));
            var progressBar = historyItem.FindElement(By.CssSelector("div.bg-\\[\\#FF0000\\]"));
            var removeBtn = _driver.FindElement(By.CssSelector("button[title='Remove from watch history']"));
            ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].click();", removeBtn);
            Thread.Sleep(1000);
            _wait.Until(ExpectedConditions.InvisibilityOfElementLocated(By.XPath(historyItemXPath)));
        }
       

        public void Dispose() => _driver.Quit();
       
    }
}