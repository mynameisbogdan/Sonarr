using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using NzbDrone.Core.Blocklisting;
using NzbDrone.Core.CustomFormats;
using NzbDrone.Core.Datastore;
using NzbDrone.Core.Indexers;
using NzbDrone.Core.Tv;
using Sonarr.Http;
using Sonarr.Http.Extensions;
using Sonarr.Http.REST.Attributes;

namespace Sonarr.Api.V3.Blocklist
{
    [V3ApiController]
    public class BlocklistController : Controller
    {
        private readonly IBlocklistService _blocklistService;
        private readonly ICustomFormatCalculationService _formatCalculator;
        private readonly ISeriesService _seriesService;

        public BlocklistController(IBlocklistService blocklistService,
                                   ICustomFormatCalculationService formatCalculator,
                                   ISeriesService seriesService)
        {
            _blocklistService = blocklistService;
            _formatCalculator = formatCalculator;
            _seriesService = seriesService;
        }

        [HttpGet]
        [Produces("application/json")]
        public PagingResource<BlocklistResource> GetBlocklist([FromQuery] PagingRequestResource paging, [FromQuery] int[] seriesIds = null, [FromQuery] DownloadProtocol[] protocols = null)
        {
            var pagingResource = new PagingResource<BlocklistResource>(paging);
            var pagingSpec = pagingResource.MapToPagingSpec<BlocklistResource, NzbDrone.Core.Blocklisting.Blocklist>("date", SortDirection.Descending);

            if (seriesIds?.Any() == true)
            {
                pagingSpec.FilterExpressions.Add(b => seriesIds.Contains(b.SeriesId));
            }

            if (protocols?.Any() == true)
            {
                pagingSpec.FilterExpressions.Add(b => protocols.Contains(b.Protocol));
            }

            return pagingSpec.ApplyToPage(b => _blocklistService.Paged(pagingSpec), b => BlocklistResourceMapper.MapToResource(b, _formatCalculator));
        }

        [HttpGet("series")]
        [Produces("application/json")]
        public List<BlocklistResource> GetSeriesBlocklist(int seriesId)
        {
            var series = _seriesService.GetSeries(seriesId);

            return _blocklistService.GetBySeriesId(seriesId).Select(bl =>
            {
                bl.Series = series;

                return bl.MapToResource(_formatCalculator);
            }).ToList();
        }

        [RestDeleteById]
        public void DeleteBlocklist(int id)
        {
            _blocklistService.Delete(id);
        }

        [HttpDelete("bulk")]
        [Produces("application/json")]
        public object Remove([FromBody] BlocklistBulkResource resource)
        {
            _blocklistService.Delete(resource.Ids);

            return new { };
        }
    }
}
