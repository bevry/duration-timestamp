# History

## v2.10.0 2020 June 20

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v2.9.0 2020 June 10

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v2.8.0 2020 June 10

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v2.7.0 2020 May 22

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v2.6.0 2020 May 21

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v2.5.0 2020 May 12

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v2.4.0 2020 May 4

-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v2.3.0 2020 May 4

-   Renamed from `extract-timestamp` to `duration-timestamp`
-   Updated dependencies, [base files](https://github.com/bevry/base), and [editions](https://editions.bevry.me) using [boundation](https://github.com/bevry/boundation)

## v2.2.0 2020 April 23

-   Add match to the replacer

## v2.1.0 2020 April 22

-   Change edition compile targets to be more compatible

## v2.0.0 2020 April 22

-   Backwards compatibility break to simplify the signatures of the methods to provide more sanity to operations

## v1.5.0 2020 April 21

-   Add suffix support to `extractTimestamp`
-   Replacer of `replaceTimestamps` will now only be called if there was actually a timestamp to give it
-   Replacer of `replaceTimestamps` can now replace with an empty string, and skip replacement by returning nothing

## v1.4.0 2020 April 21

-   Added `extractYoutubePlaylistID`

## v1.3.0 2020 April 20

-   Improved `extractYoutubeID` handling - it can now fetch youtube video ids from youtube shortlinks like <https://youtu.be/I8Xc2_FtpHI>

## v1.2.0 2020 April 17

-   Improved `extractYoutubeID` handling - it now cycles through the elements of any type - rather than cycles through the elements of each type
    -   Which should result in more accurate indentification of the intended video, by preferring the first youtube video regardless of type

## v1.1.0 2020 April 7

-   Updated some function signatures
-   Handle invalid timestamps by returning `null`
-   Added stringify formats

## v1.0.0 2020 April 6

-   Initial workimg release
