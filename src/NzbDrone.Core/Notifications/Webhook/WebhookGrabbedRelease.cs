using NzbDrone.Core.Parser.Model;

namespace NzbDrone.Core.Notifications.Webhook
{
    public class WebhookGrabbedRelease
    {
        public WebhookGrabbedRelease()
        {
        }

        public WebhookGrabbedRelease(GrabbedReleaseInfo release)
        {
            if (release == null)
            {
                return;
            }

            ReleaseTitle = release.Title;
            Indexer = release.Indexer;
            Size = release.Size;
            IndexerFlags = release.IndexerFlags;
            ReleaseType = release.ReleaseType;
        }

        public WebhookGrabbedRelease(GrabbedReleaseInfo release, IndexerFlags indexerFlags, ReleaseType releaseType)
        {
            if (release == null)
            {
                IndexerFlags = indexerFlags;
                ReleaseType = releaseType;

                return;
            }

            ReleaseTitle = release.Title;
            Indexer = release.Indexer;
            Size = release.Size;
            IndexerFlags = release.IndexerFlags;
            ReleaseType = release.ReleaseType;
        }

        public string ReleaseTitle { get; set; }
        public string Indexer { get; set; }
        public long? Size { get; set; }
        public IndexerFlags IndexerFlags { get; set; }
        public ReleaseType ReleaseType { get; set; }
    }
}
