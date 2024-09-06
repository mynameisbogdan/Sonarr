import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import ProtocolLabel from 'Activity/Queue/ProtocolLabel';
import AppState from 'App/State/AppState';
import Icon from 'Components/Icon';
import Link from 'Components/Link/Link';
import SpinnerIconButton from 'Components/Link/SpinnerIconButton';
import ConfirmModal from 'Components/Modal/ConfirmModal';
import TableRowCell from 'Components/Table/Cells/TableRowCell';
import TableRow from 'Components/Table/TableRow';
import Popover from 'Components/Tooltip/Popover';
import Tooltip from 'Components/Tooltip/Tooltip';
import EpisodeFormats from 'Episode/EpisodeFormats';
import EpisodeLanguages from 'Episode/EpisodeLanguages';
import EpisodeQuality from 'Episode/EpisodeQuality';
import IndexerFlags from 'Episode/IndexerFlags';
import useModalOpenState from 'Helpers/Hooks/useModalOpenState';
import usePrevious from 'Helpers/Hooks/usePrevious';
import { icons, kinds, tooltipPositions } from 'Helpers/Props';
import InteractiveSearchPayload from 'InteractiveSearch/InteractiveSearchPayload';
import { blocklistRelease } from 'Store/Actions/releaseActions';
import { fetchSeriesBlocklist } from 'Store/Actions/seriesBlocklistActions';
import { fetchSeriesHistory } from 'Store/Actions/seriesHistoryActions';
import createUISettingsSelector from 'Store/Selectors/createUISettingsSelector';
import Release from 'typings/Release';
import formatDateTime from 'Utilities/Date/formatDateTime';
import getRelativeDate from 'Utilities/Date/getRelativeDate';
import formatAge from 'Utilities/Number/formatAge';
import formatBytes from 'Utilities/Number/formatBytes';
import formatCustomFormatScore from 'Utilities/Number/formatCustomFormatScore';
import translate from 'Utilities/String/translate';
import OverrideMatchModal from './OverrideMatch/OverrideMatchModal';
import Peers from './Peers';
import ReleaseSceneIndicator from './ReleaseSceneIndicator';
import styles from './InteractiveSearchRow.css';

function getDownloadIcon(
  isGrabbing: boolean,
  isGrabbed: boolean,
  grabError?: string
) {
  if (isGrabbing) {
    return icons.SPINNER;
  } else if (isGrabbed) {
    return icons.DOWNLOADING;
  } else if (grabError) {
    return icons.DOWNLOADING;
  }

  return icons.DOWNLOAD;
}

function getDownloadKind(isGrabbed: boolean, grabError?: string) {
  if (isGrabbed) {
    return kinds.SUCCESS;
  }

  if (grabError) {
    return kinds.DANGER;
  }

  return kinds.DEFAULT;
}

function getDownloadTooltip(
  isGrabbing: boolean,
  isGrabbed: boolean,
  grabError?: string
) {
  if (isGrabbing) {
    return '';
  } else if (isGrabbed) {
    return translate('AddedToDownloadQueue');
  } else if (grabError) {
    return grabError;
  }

  return translate('AddToDownloadQueue');
}

function releaseHistorySelector(release: Release) {
  return createSelector(
    (state: AppState) => state.seriesHistory.items,
    (state: AppState) => state.seriesBlocklist.items,
    (seriesHistory, seriesBlocklist) => {
      const { guid, isBlocklisted = false } = release;

      let historyFailedData = null;
      let blocklistedData = null;

      const historyGrabbedData = seriesHistory.find(
        ({ eventType, data }) =>
          eventType === 'grabbed' && 'guid' in data && data.guid === guid
      );

      if (historyGrabbedData) {
        historyFailedData = seriesHistory.find(
          ({ eventType, sourceTitle }) =>
            eventType === 'downloadFailed' &&
            sourceTitle === historyGrabbedData.sourceTitle
        );
      }

      if (isBlocklisted) {
        blocklistedData = seriesBlocklist.find(
          ({ protocol, indexer, sourceTitle, torrentInfoHash }) =>
            protocol === release.protocol &&
            ((release.protocol === 'torrent' &&
              release.infoHash &&
              release.infoHash === torrentInfoHash) ||
              (indexer === release.indexer && sourceTitle === release.title))
        );
      }

      return {
        historyGrabbedData,
        historyFailedData,
        blocklistedData,
      };
    }
  );
}

interface InteractiveSearchRowProps extends Release {
  seriesId: number;
  searchPayload: InteractiveSearchPayload;
  onGrabPress(...args: unknown[]): void;
}

function InteractiveSearchRow(props: InteractiveSearchRowProps) {
  const {
    seriesId,
    guid,
    indexerId,
    protocol,
    age,
    ageHours,
    ageMinutes,
    publishDate,
    title,
    infoUrl,
    indexer,
    size,
    seeders,
    leechers,
    quality,
    languages,
    customFormatScore,
    customFormats,
    sceneMapping,
    seasonNumber,
    episodeNumbers,
    absoluteEpisodeNumbers,
    mappedSeriesId,
    mappedSeasonNumber,
    mappedEpisodeNumbers,
    mappedAbsoluteEpisodeNumbers,
    mappedEpisodeInfo,
    indexerFlags = 0,
    rejections = [],
    episodeRequested,
    downloadAllowed,
    isDaily,
    isGrabbing = false,
    isGrabbed = false,
    grabError,
    isBlocklisting = false,
    isBlocklisted = false,
    blocklistError,
    searchPayload,
    onGrabPress,
  } = props;

  const { historyGrabbedData, historyFailedData, blocklistedData } =
    useSelector(releaseHistorySelector(props));
  const { showRelativeDates, shortDateFormat, longDateFormat, timeFormat } =
    useSelector(createUISettingsSelector());

  const [isConfirmGrabModalOpen, setIsConfirmGrabModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [
    isBlockReleaseModalOpen,
    setBlockReleaseModalOpen,
    setBlockReleaseModalClosed,
  ] = useModalOpenState(false);

  const previousIsGrabbing = usePrevious(isGrabbing);
  const previousIsBlocklisting = usePrevious(isBlocklisting);

  const dispatch = useDispatch();

  const onGrabPressWrapper = useCallback(() => {
    if (downloadAllowed) {
      onGrabPress({
        guid,
        indexerId,
      });

      return;
    }

    setIsConfirmGrabModalOpen(true);
  }, [
    guid,
    indexerId,
    downloadAllowed,
    onGrabPress,
    setIsConfirmGrabModalOpen,
  ]);

  const onGrabConfirm = useCallback(() => {
    setIsConfirmGrabModalOpen(false);

    onGrabPress({
      guid,
      indexerId,
      ...searchPayload,
    });
  }, [guid, indexerId, searchPayload, onGrabPress, setIsConfirmGrabModalOpen]);

  const onGrabCancel = useCallback(() => {
    setIsConfirmGrabModalOpen(false);
  }, [setIsConfirmGrabModalOpen]);

  const onOverridePress = useCallback(() => {
    setIsOverrideModalOpen(true);
  }, [setIsOverrideModalOpen]);

  const onOverrideModalClose = useCallback(() => {
    setIsOverrideModalOpen(false);
  }, [setIsOverrideModalOpen]);

  const handleBlocklistReleasePress = useCallback(() => {
    dispatch(
      blocklistRelease({
        guid,
        indexerId,
      })
    );

    setBlockReleaseModalClosed();
  }, [guid, indexerId, setBlockReleaseModalClosed, dispatch]);

  useEffect(() => {
    if (previousIsGrabbing && !isGrabbing) {
      dispatch(fetchSeriesHistory({ seriesId }));
    }
  }, [seriesId, previousIsGrabbing, isGrabbing, dispatch]);

  useEffect(() => {
    if (previousIsBlocklisting && !isBlocklisting && !blocklistError) {
      dispatch(fetchSeriesBlocklist({ seriesId }));
    }
  }, [
    seriesId,
    previousIsBlocklisting,
    isBlocklisting,
    blocklistError,
    dispatch,
  ]);

  return (
    <TableRow>
      <TableRowCell className={styles.protocol}>
        <ProtocolLabel protocol={protocol} />
      </TableRowCell>

      <TableRowCell
        className={styles.age}
        title={formatDateTime(publishDate, longDateFormat, timeFormat, {
          includeSeconds: true,
        })}
      >
        {formatAge(age, ageHours, ageMinutes)}
      </TableRowCell>

      <TableRowCell>
        <div className={styles.titleContent}>
          <Link to={infoUrl}>{title}</Link>
          <ReleaseSceneIndicator
            className={styles.sceneMapping}
            seasonNumber={mappedSeasonNumber}
            episodeNumbers={mappedEpisodeNumbers}
            absoluteEpisodeNumbers={mappedAbsoluteEpisodeNumbers}
            sceneSeasonNumber={seasonNumber}
            sceneEpisodeNumbers={episodeNumbers}
            sceneAbsoluteEpisodeNumbers={absoluteEpisodeNumbers}
            sceneMapping={sceneMapping}
            episodeRequested={episodeRequested}
            isDaily={isDaily}
          />
        </div>
      </TableRowCell>

      <TableRowCell className={styles.indexer}>{indexer}</TableRowCell>

      <TableRowCell className={styles.history}>
        {historyGrabbedData?.date && !historyFailedData?.date ? (
          <Tooltip
            anchor={<Icon name={icons.DOWNLOADING} kind={kinds.DEFAULT} />}
            tooltip={translate('GrabbedAt', {
              date: getRelativeDate({
                date: historyGrabbedData.date,
                shortDateFormat,
                showRelativeDates,
                timeFormat,
                timeForToday: true,
                includeSeconds: true,
              }),
            })}
            kind={kinds.INVERSE}
            position={tooltipPositions.LEFT}
          />
        ) : null}

        {historyFailedData?.date ? (
          <Tooltip
            anchor={<Icon name={icons.DOWNLOADING} kind={kinds.DANGER} />}
            tooltip={translate('FailedAt', {
              date: getRelativeDate({
                date: historyFailedData.date,
                shortDateFormat,
                showRelativeDates,
                timeFormat,
                timeForToday: true,
                includeSeconds: true,
              }),
            })}
            kind={kinds.INVERSE}
            position={tooltipPositions.LEFT}
          />
        ) : null}

        {isBlocklisted ? (
          <Tooltip
            anchor={
              <Icon
                className={
                  historyGrabbedData || historyFailedData
                    ? styles.blocklist
                    : undefined
                }
                name={icons.BLOCKLIST}
                kind={kinds.DANGER}
              />
            }
            tooltip={
              blocklistedData?.date
                ? translate('BlocklistedAt', {
                    date: getRelativeDate({
                      date: blocklistedData.date,
                      shortDateFormat,
                      showRelativeDates,
                      timeFormat,
                      timeForToday: true,
                      includeSeconds: true,
                    }),
                  })
                : translate('Blocklisted')
            }
            kind={kinds.INVERSE}
            position={tooltipPositions.LEFT}
          />
        ) : null}
      </TableRowCell>

      <TableRowCell className={styles.size}>{formatBytes(size)}</TableRowCell>

      <TableRowCell className={styles.peers}>
        {protocol === 'torrent' ? (
          <Peers seeders={seeders} leechers={leechers} />
        ) : null}
      </TableRowCell>

      <TableRowCell className={styles.languages}>
        <EpisodeLanguages languages={languages} />
      </TableRowCell>

      <TableRowCell className={styles.quality}>
        <EpisodeQuality quality={quality} showRevision={true} />
      </TableRowCell>

      <TableRowCell className={styles.customFormatScore}>
        <Tooltip
          anchor={formatCustomFormatScore(
            customFormatScore,
            customFormats.length
          )}
          tooltip={<EpisodeFormats formats={customFormats} />}
          position={tooltipPositions.LEFT}
        />
      </TableRowCell>

      <TableRowCell className={styles.indexerFlags}>
        {indexerFlags ? (
          <Popover
            anchor={<Icon name={icons.FLAG} />}
            title={translate('IndexerFlags')}
            body={<IndexerFlags indexerFlags={indexerFlags} />}
            position={tooltipPositions.LEFT}
          />
        ) : null}
      </TableRowCell>

      <TableRowCell className={styles.rejected}>
        {rejections.length ? (
          <Popover
            anchor={<Icon name={icons.DANGER} kind={kinds.DANGER} />}
            title={translate('ReleaseRejected')}
            body={
              <ul>
                {rejections.map((rejection, index) => {
                  return <li key={index}>{rejection}</li>;
                })}
              </ul>
            }
            position={tooltipPositions.LEFT}
          />
        ) : null}
      </TableRowCell>

      <TableRowCell className={styles.download}>
        <SpinnerIconButton
          name={getDownloadIcon(isGrabbing, isGrabbed, grabError)}
          kind={getDownloadKind(isGrabbed, grabError)}
          title={getDownloadTooltip(isGrabbing, isGrabbed, grabError)}
          isSpinning={isGrabbing}
          onPress={onGrabPressWrapper}
        />

        <Link
          className={styles.manualDownloadContent}
          title={translate('OverrideAndAddToDownloadQueue')}
          onPress={onOverridePress}
        >
          <div className={styles.manualDownloadContent}>
            <Icon
              className={styles.interactiveIcon}
              name={icons.INTERACTIVE}
              size={12}
            />

            <Icon
              className={styles.downloadIcon}
              name={icons.CIRCLE_DOWN}
              size={10}
            />
          </div>
        </Link>

        {isBlocklisted ? null : (
          <SpinnerIconButton
            name={icons.REMOVE}
            kind={blocklistError ? kinds.DANGER : kinds.DEFAULT}
            title={translate('BlockRelease')}
            size={14}
            isSpinning={isBlocklisting}
            onPress={setBlockReleaseModalOpen}
          />
        )}
      </TableRowCell>

      <ConfirmModal
        isOpen={isConfirmGrabModalOpen}
        kind={kinds.WARNING}
        title={translate('GrabRelease')}
        message={translate('GrabReleaseUnknownSeriesOrEpisodeMessageText', {
          title,
        })}
        confirmLabel={translate('Grab')}
        onConfirm={onGrabConfirm}
        onCancel={onGrabCancel}
      />

      <OverrideMatchModal
        isOpen={isOverrideModalOpen}
        title={title}
        indexerId={indexerId}
        guid={guid}
        seriesId={mappedSeriesId}
        seasonNumber={mappedSeasonNumber}
        episodes={mappedEpisodeInfo}
        languages={languages}
        quality={quality}
        protocol={protocol}
        isGrabbing={isGrabbing}
        grabError={grabError}
        onModalClose={onOverrideModalClose}
      />

      <ConfirmModal
        isOpen={isBlockReleaseModalOpen}
        kind={kinds.DANGER}
        title={translate('BlockRelease')}
        message={translate('BlockReleaseConfirmation', { title })}
        confirmLabel={translate('BlockRelease')}
        onConfirm={handleBlocklistReleasePress}
        onCancel={setBlockReleaseModalClosed}
      />
    </TableRow>
  );
}

export default InteractiveSearchRow;
