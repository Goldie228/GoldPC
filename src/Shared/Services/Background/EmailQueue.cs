using System.Threading.Channels;

namespace GoldPC.Shared.Services.Background;

public interface IEmailQueue
{
    ValueTask QueueEmailAsync(EmailJob job);
    IAsyncEnumerable<EmailJob> DequeueAllAsync(CancellationToken ct);
}

public class EmailQueue : IEmailQueue
{
    private readonly Channel<EmailJob> _queue;

    public EmailQueue(int capacity = 100)
    {
        _queue = Channel.CreateBounded<EmailJob>(new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait
        });
    }

    public async ValueTask QueueEmailAsync(EmailJob job)
    {
        await _queue.Writer.WriteAsync(job);
    }

    public IAsyncEnumerable<EmailJob> DequeueAllAsync(CancellationToken ct)
    {
        return _queue.Reader.ReadAllAsync(ct);
    }
}
