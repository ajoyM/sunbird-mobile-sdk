import { GetFaqRequest } from './../def/get-faq-request';
import { CachedItemStore } from '../../key-value-store';
import { Path } from '../../util/file/util/path';
import { FileService } from '../../util/file/def/file-service';
import { ApiService, HttpRequestType, Request } from '../../api';
import { Observable } from 'rxjs';
import { FaqServiceConfig, Faq } from '..';


export class GetFaqDetailsHandler {
    private readonly FAQ_FILE_KEY_PREFIX = 'faq-';
    private readonly FAQ_LOCAL_KEY = 'faq-';

    constructor(
        private apiService: ApiService,
        private faqServiceConfig: FaqServiceConfig,
        private fileservice: FileService,
        private cachedItemStore: CachedItemStore) {
    }

    handle(request: GetFaqRequest): Observable<any> {
        return this.cachedItemStore.getCached(
            request.language,
            this.FAQ_LOCAL_KEY,
            'ttl_' + this.FAQ_LOCAL_KEY,
            () => this.fetchFromServer(request),
            () => this.fetchFromFile(request.language)
        );
    }

    private fetchFromServer(request: GetFaqRequest): Observable <Faq> {
    const apiRequest: Request = new Request.Builder()
        .withType(HttpRequestType.GET)
        .withHost(request.faqUrl)
        .withPath( '/faq-' + request.language + '.json')
        .withApiToken(false)
        .build();

    return this.apiService.fetch(apiRequest)
        .map((response) => {
            const resp = JSON.parse(response.body.trim());
            return resp;
        });
    }

    private fetchFromFile(language: string): Observable <Faq> {
        const dir = Path.ASSETS_PATH + this.faqServiceConfig.faqConfigDirPath;
        const file = this.FAQ_FILE_KEY_PREFIX + language + '.json';

        return Observable.fromPromise(this.fileservice.readFileFromAssets(dir.concat('/', file)))
        .map((filecontent: string) => {
            const result = JSON.parse(filecontent);
            return result;
        });
    }


}