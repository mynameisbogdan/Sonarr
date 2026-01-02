using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using NzbDrone.Common.Disk;
using NzbDrone.Common.Extensions;
using NzbDrone.Core.Localization;
using NzbDrone.Core.MediaFiles;
using NzbDrone.Core.RootFolders;
using NzbDrone.Core.Tv;

namespace NzbDrone.Core.HealthCheck.Checks
{
    public class RootFolderOrphanedDataCheck : HealthCheckBase
    {
        private readonly ISeriesService _seriesService;
        private readonly IDiskProvider _diskProvider;
        private readonly IRootFolderService _rootFolderService;
        private readonly IDiskScanService _diskScanService;
        private readonly IMediaFileRepository _mediaFileRepository;

        public override bool CheckOnSchedule => false;

        public RootFolderOrphanedDataCheck(
            ISeriesService seriesService,
            IDiskProvider diskProvider,
            IRootFolderService rootFolderService,
            IDiskScanService diskScanService,
            IMediaFileRepository mediaFileRepository,
            ILocalizationService localizationService)
            : base(localizationService)
        {
            _seriesService = seriesService;
            _diskProvider = diskProvider;
            _rootFolderService = rootFolderService;
            _diskScanService = diskScanService;
            _mediaFileRepository = mediaFileRepository;
        }

        public override HealthCheck Check()
        {
            var rootFolders = _seriesService.GetAllSeriesPaths()
                .Select(s => _rootFolderService.GetBestRootFolderPath(s.Value))
                .Distinct()
                .Where(s => s.IsPathValid(PathValidationType.CurrentOs) && _diskProvider.FolderExists(s))
                .ToList();

            var orphanedFiles = GetOrphanedFiles(rootFolders).ToList();

            if (orphanedFiles.Any())
            {
                return new HealthCheck(GetType(),
                    HealthCheckResult.Error,
                    $"Orphaned files: {string.Join(" | ", orphanedFiles)}");
            }

            return new HealthCheck(GetType());
        }

        private IEnumerable<string> GetOrphanedFiles(List<string> rootFolders)
        {
            var episodeFilePaths = _mediaFileRepository.All().Select(e => e.RelativePath).ToList();

            foreach (var rootFolder in rootFolders)
            {
                foreach (var file in _diskScanService.GetVideoFiles(rootFolder))
                {
                    if (!episodeFilePaths.Any(e => file.EndsWith(e, StringComparison.Ordinal)))
                    {
                        yield return Path.GetFileName(file);
                    }
                }
            }
        }
    }
}
