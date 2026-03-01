using System.Collections.Generic;
using NzbDrone.Common.Http;
using NzbDrone.Core.DataAugmentation.Scene;

namespace NzbDrone.Core.DataAugmentation.UserScene;

public class UserSceneProvider : ISceneMappingProvider
{
    private const string MappingsUri = "https://raw.githubusercontent.com/mynameisbogdan/SceneMappings/refs/heads/main/mappings.json";

    private readonly IHttpClient _httpClient;

    public UserSceneProvider(IHttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public List<SceneMapping> GetSceneMappings()
    {
        var request = new HttpRequestBuilder(MappingsUri).Build();

        return _httpClient.Get<List<SceneMapping>>(request).Resource;
    }
}
