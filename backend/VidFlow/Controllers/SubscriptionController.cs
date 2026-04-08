using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VidFlow.Services;

[ApiController]
[Route("api/subscriptions")]
[Authorize]
public class SubscriptionController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpPost("{channelId}")]
    public async Task<IActionResult> Subscribe(Guid channelId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _subscriptionService.SubscribeAsync(userId, channelId);

        if (!success)
            return Conflict(new { message });

        return Ok(new { message });
    }

    [HttpDelete("{channelId}")]
    public async Task<IActionResult> Unsubscribe(Guid channelId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _subscriptionService.UnsubscribeAsync(userId, channelId);

        if (!success)
            return NotFound(new { message });

        return Ok(new { message });
    }

    [HttpPatch("{channelId}/notifications")]
    public async Task<IActionResult> ToggleNotification(Guid channelId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var (success, message) = await _subscriptionService.ToggleNotificationAsync(userId, channelId);

        if (!success)
            return NotFound(new { message });

        return Ok(new { message });
    }

    [HttpGet]
    public async Task<IActionResult> GetMySubscriptions()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var subscriptions = await _subscriptionService.GetUserSubscriptionsAsync(userId);

        return Ok(subscriptions);
    }

    [HttpGet("{channelId}/status")]
    public async Task<IActionResult> GetSubscriptionStatus(Guid channelId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var isSubscribed = await _subscriptionService.IsSubscribedAsync(userId, channelId);

        return Ok(new { isSubscribed });
    }
}