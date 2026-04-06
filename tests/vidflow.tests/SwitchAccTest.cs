using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using SeleniumExtras.WaitHelpers;
using Xunit;
namespace vidflow.tests
{

    public class SwitchAccountsTest : IDisposable
    {
        private readonly IWebDriver _driver;
        private readonly WebDriverWait _wait;
        private const string url= "http://localhost:3000";
        public SwitchAccountsTest()
        {
           
            _driver = new ChromeDriver();
            _driver.Manage().Window.Maximize();
            _wait = new WebDriverWait(_driver,TimeSpan.FromSeconds(5));
        }
        [Fact]
        public void Switch_Account_Test()
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
            var avatarTrigger = _wait.Until(ExpectedConditions.ElementToBeClickable(
            By.CssSelector("span[data-slot='dropdown-menu-trigger']")));
            avatarTrigger.Click();
            var switchAccountBtn = _wait.Until(ExpectedConditions.ElementToBeClickable(
            By.XPath("//span[text()='Switch account']/ancestor::div[@role='menuitem']")));
            switchAccountBtn.Click();
            _wait.Until(ExpectedConditions.ElementIsVisible(By.XPath("//span[text()='Accounts']")));
            var addAccountBtn = _wait.Until(ExpectedConditions.ElementToBeClickable(
            By.XPath("//span[text()='Add account']/ancestor::div[@role='menuitem']")));
            addAccountBtn.Click();
            var email2 = _wait.Until(ExpectedConditions.ElementToBeClickable(By.Name("email")));
            email2.SendKeys("misedmitro@gmail.com");
            Thread.Sleep(1000);
            var password2 = _driver.FindElement(By.Name("password"));
            password2.SendKeys("test123");
            Thread.Sleep(500);
            var submitButton2 = _wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//button[text()='Next']")));
            submitButton2.Click();
            Thread.Sleep(1000);
            _wait.Until(ExpectedConditions.UrlContains("/"));
            Assert.Contains("/", _driver.Url);
            var newAvatarTrigger=_wait.Until(ExpectedConditions.ElementToBeClickable(By.CssSelector("span[data-slot='dropdown-menu-trigger']")));
            newAvatarTrigger.Click();
            Thread.Sleep(1000);
            var newSwitchAccountBtn=_wait.Until(ExpectedConditions.ElementToBeClickable(By.XPath("//span[text()='Switch account']/ancestor::div[@role='menuitem']")));
            newSwitchAccountBtn.Click();
            Thread.Sleep(1000);
            var accountItems = _driver.FindElements(By.XPath("//div[@role='menuitem']//span[contains(@class, 'text-[#AAAAAA]')]"));
            int accountsCount=accountItems.Count();
            Assert.True(accountsCount>=2,"Аккаунтів менш двух");
            var emails = accountItems.Select(e => e.Text).ToList();
            Assert.Contains("test@gmail.com", emails);
            Assert.Contains("misedmitro@gmail.com", emails);
        }
        
        public void Dispose() => _driver.Quit();
       
    }
}