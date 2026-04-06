using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;
using Xunit;
namespace vidflow.tests
{
    public class VideoSubscribeTest : IDisposable
    {
        private readonly IWebDriver _driver;
        private readonly WebDriverWait _wait;
        private const string url = "http://localhost:3000";

        public VideoSubscribeTest()
        {

            _driver = new ChromeDriver();
            _driver.Manage().Window.Maximize();
            _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(5));
        }
        [Fact]
        public void Subscribe_Channel_Test()
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
            var submitButton1 = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[text()='Next']")));
            submitButton1.Click();
            Thread.Sleep(1000);
            _wait.Until(ExpectedConditions.UrlContains("/"));
            Assert.Contains("/", _driver.Url);

            _driver.Navigate().GoToUrl(url);
            var searchInput = _wait.Until(ExpectedConditions.ElementIsVisible(By.CssSelector("input[type='text']")));
            string channelName = "123";
            searchInput.SendKeys(channelName + Keys.Enter);
            var searchBtn = _driver.FindElement(By.CssSelector("button[type='submit']"));
            searchBtn.Click();
            Thread.Sleep(2200);
            var actionButton = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[contains(., 'Subscribe') or contains(., 'Subscribed')]")));
            if(actionButton.Text.Contains("Subscribed"))
                {
                actionButton.Click();
                Thread.Sleep(1000);
                _wait.Until(d => !actionButton.Text.Contains("Subscribed") && actionButton.Text.Contains("Subscribe"));
                actionButton.Click();
            }
            else
            {
                actionButton.Click();
            }
            Thread.Sleep(1000);

            _wait.Until(d => {
                try
                {
                var subscribedSpan = d.FindElement(By.XPath("//button//span[text()='Subscribed']"));
                return subscribedSpan.Displayed;
                }
                catch (StaleElementReferenceException)
                {
                    return false;
                }
                catch (NoSuchElementException)
                {
                    return false;
                }
            });
            _driver.Navigate().GoToUrl(url);
            var subscribedChannel=_wait.Until(ExpectedConditions.ElementIsVisible(By.XPath($"//a[contains(@href, '/channel/')]//span[text()='{channelName}']")));
            Assert.NotNull(subscribedChannel);
            Assert.Equal(channelName, subscribedChannel.Text);
        }
 
        public void Dispose() => _driver.Quit();
       
    }
}