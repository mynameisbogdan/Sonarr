using System;

namespace NzbDrone.Core.Download.Clients
{
    public class TorrentSeedConfiguration
    {
        public double? Ratio { get; set; }
        public TimeSpan? SeedTime { get; set; }
        public double? DownloadSpeedLimit { get; set; }
        public double? UploadSpeedLimit { get; set; }
    }
}
