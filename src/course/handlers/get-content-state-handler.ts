import {ApiService, HttpRequestType, Request} from '../../api';
import {CourseServiceConfig, GetContentStateRequest} from '..';
import {defer, iif, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ContentService} from '../../content';
import {Container} from 'inversify';
import {InjectionTokens} from '../../injection-tokens';

export class GetContentStateHandler {
    private readonly GET_CONTENT_STATE_KEY_PREFIX = 'getContentState';
    private readonly GET_CONTENT_STATE_ENDPOINT = '/content/state/read';

    constructor(
        private apiService: ApiService,
        private courseServiceConfig: CourseServiceConfig,
        private container: Container
    ) {
    }

    private get contentService(): ContentService {
        return this.container.get(InjectionTokens.CONTENT_SERVICE);
    }

    public handle(contentStateRequest: GetContentStateRequest): Observable<any> {
        delete contentStateRequest['returnRefreshedContentStates'];

        return iif(
            () => !contentStateRequest.contentIds || !contentStateRequest.contentIds.length,
            defer(async () => {
                contentStateRequest.contentIds = await this.contentService.getContentDetails({
                    contentId: contentStateRequest.courseId
                }).toPromise().then((content) => content.contentData['leafNodes'] || []);

                return this.fetchFromApi(contentStateRequest).toPromise();
            }),
            defer(() => this.fetchFromApi(contentStateRequest))
        );
    }

    private fetchFromApi(contentStateRequest: GetContentStateRequest) {
        if (contentStateRequest.contentIds && !contentStateRequest.contentIds.length) {
            delete contentStateRequest.contentIds;
        }

        const apiRequest: Request = new Request.Builder()
            .withType(HttpRequestType.POST)
            .withPath(this.courseServiceConfig.apiPath + this.GET_CONTENT_STATE_ENDPOINT)
            .withBearerToken(true)
            .withUserToken(true)
            .withBody({request: contentStateRequest})
            .build();

        return defer(async () => {
            return this.apiService.fetch<any>(apiRequest).pipe(
                map((response) => {
                    return response.body;
                })
            ).toPromise();
        });
    }
}
