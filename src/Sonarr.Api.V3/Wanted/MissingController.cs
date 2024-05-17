using System.Linq;
using Microsoft.AspNetCore.Mvc;
using NzbDrone.Core.CustomFormats;
using NzbDrone.Core.Datastore;
using NzbDrone.Core.DecisionEngine.Specifications;
using NzbDrone.Core.Queue;
using NzbDrone.Core.Tv;
using NzbDrone.SignalR;
using Sonarr.Api.V3.Episodes;
using Sonarr.Http;
using Sonarr.Http.Extensions;

namespace Sonarr.Api.V3.Wanted
{
    [V3ApiController("wanted/missing")]
    public class MissingController : EpisodeControllerWithSignalR
    {
        private readonly IQueueService _queueService;

        public MissingController(IEpisodeService episodeService,
                             ISeriesService seriesService,
                             IUpgradableSpecification upgradableSpecification,
                             ICustomFormatCalculationService formatCalculator,
                             IQueueService queueService,
                             IBroadcastSignalRMessage signalRBroadcaster)
            : base(episodeService, seriesService, upgradableSpecification, formatCalculator, signalRBroadcaster)
        {
            _queueService = queueService;
        }

        [HttpGet]
        [Produces("application/json")]
        public PagingResource<EpisodeResource> GetMissingEpisodes([FromQuery] PagingRequestResource paging,
            [FromQuery] int[] seriesIds = null,
            [FromQuery] bool? includeQueue = null,
            [FromQuery] bool includeSeries = false,
            [FromQuery] bool includeImages = false,
            [FromQuery] bool monitored = true)
        {
            var pagingResource = new PagingResource<EpisodeResource>(paging);
            var pagingSpec = new PagingSpec<Episode>
            {
                Page = pagingResource.Page,
                PageSize = pagingResource.PageSize,
                SortKey = pagingResource.SortKey,
                SortDirection = pagingResource.SortDirection
            };

            if (monitored)
            {
                pagingSpec.FilterExpressions.Add(v => v.Monitored == true && v.Series.Monitored == true);
            }
            else
            {
                pagingSpec.FilterExpressions.Add(v => v.Monitored == false || v.Series.Monitored == false);
            }

            if (seriesIds?.Any() == true)
            {
                pagingSpec.FilterExpressions.Add(v => seriesIds.Contains(v.SeriesId));
            }

            if (includeQueue.HasValue)
            {
                var queue = _queueService.GetQueue().Where(q => q.Episode != null).Select(q => q.Episode.Id);

                pagingSpec.FilterExpressions.Add(v => !queue.Contains(v.Id));
            }

            return pagingSpec.ApplyToPage(_ => _episodeService.EpisodesWithoutFiles(pagingSpec), v => MapToResource(v, includeSeries, false, includeImages));
        }
    }
}
