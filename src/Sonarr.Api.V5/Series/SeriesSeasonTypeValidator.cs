using FluentValidation.Validators;
using NzbDrone.Core.MediaFiles;
using NzbDrone.Core.Tv;

namespace Sonarr.Api.V5.Series;

public class SeriesSeasonTypeValidator : PropertyValidator
{
    private readonly ISeriesService _seriesService;
    private readonly IMediaFileService _mediaFileService;

    public SeriesSeasonTypeValidator(ISeriesService seriesService, IMediaFileService mediaFileService)
    {
        _seriesService = seriesService;
        _mediaFileService = mediaFileService;
    }

    protected override string GetDefaultMessageTemplate() => "Can't change season type for series with existing episode files.";

    protected override bool IsValid(PropertyValidatorContext context)
    {
        if (context.PropertyValue is not string seasonType)
        {
            return true;
        }

        if (context.InstanceToValidate is not SeriesResource seriesResource)
        {
            return true;
        }

        var series = _seriesService.GetSeries(seriesResource.Id);

        if (seasonType == series.SeasonType)
        {
            return true;
        }

        var files = _mediaFileService.GetFilesBySeries(seriesResource.Id);

        return files.Count == 0;
    }
}
