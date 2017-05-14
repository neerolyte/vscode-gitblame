import {workspace} from 'vscode';
import * as moment from 'moment';
import * as ObjectPath from 'object-path';

export class TextDecorator {

    static toTextView(commit: Object) : string {
        const config = workspace.getConfiguration('gitblame');

        if (commit['hash'] === '0000000000000000000000000000000000000000') {
            return <string>config.get('statusBarMessageNoCommit');
        }
        else {
            let normalizedCommitInfo = TextDecorator.normalizeCommitInfoTokens(commit);
            let messageFormat = <string>config.get('statusBarMessageFormat');
            return TextDecorator.parseTokens(messageFormat, normalizedCommitInfo);
        }
    }

    static toDateText(dateNow: Date, dateThen: Date) : string {

        const momentNow = moment(dateNow);
        const momentThen = moment(dateThen);

        const months = momentNow.diff(momentThen, 'months');
        const days = momentNow.diff(momentThen, 'days');
        const hours = momentNow.diff(momentThen, 'hours');
        const minutes = momentNow.diff(momentThen, 'minutes');

        if (minutes <= 4) {
            return 'right now';
        }
        else if (minutes <= 70) {
            return minutes + ' minutes ago';
        }
        else if (hours <= 47) {
            return hours + ' hours ago';
        }
        else if (days <= 40) {
            return days + ' days ago';
        }
        else {
            return months + ' months ago';
        }
    }

    static parseTokens(target: string, tokens: object = {}): string {
        const tokenRegex = /\$\{([a-z\.\-]{1,})[,]*(|.{1,}?)(?=\})}/gi;

        return target.replace(tokenRegex, (string: string, key: string, value: string): string => {
            let currentToken = ObjectPath.get(tokens, key)

            if (typeof currentToken === 'string') {
                return currentToken;
            }
            else if (typeof currentToken === 'number') {
                return currentToken.toString();
            }
            else if (typeof currentToken === 'function') {
                let newString = currentToken.call(this, value, key);

                if (typeof newString === 'string') {
                    return newString;
                }
                else if (typeof newString === 'number') {
                    return newString.toString();
                }
            }

            return key;
        });
    }

    static normalizeCommitInfoTokens(commitInfo) {
        const now = new Date();
        const authorTime = moment.unix(commitInfo.author.timestamp);
        const committerTime = moment.unix(commitInfo.committer.timestamp);
        return {
            'commit': {
                'hash': commitInfo.hash,
                'hash_short': (length = 7) => commitInfo.hash.substr(0, length),
                'summary': commitInfo.summary,
                'filename': commitInfo.filename
            },
            'author': commitInfo.author,
            'committer': commitInfo.committer,
            'time': {
                'ago': () => TextDecorator.toDateText(now, authorTime.toDate()),
                'from': () => authorTime.fromNow(),
                'custom': (momentFormat) => authorTime.format(momentFormat),
                'c_ago': () => TextDecorator.toDateText(now, committerTime.toDate()),
                'c_from': () => committerTime.fromNow(),
                'c_custom': (momentFormat) => committerTime.format(momentFormat)
            }
        }
    }
}