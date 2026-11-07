import React, { memo, useCallback, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { RefreshControl, SectionList, StyleSheet, Text } from 'react-native';

import {
  EmptyView,
  ErrorScreenV2,
  SearchbarV2,
  SafeAreaView,
} from '@components';
import { RightIcon } from '@components/SearchbarV2/SearchbarV2';

import { useSearch } from '@hooks';
import { useAppSettings, useTheme } from '@hooks/persisted';
import { getString } from '@i18n/translations';
import { ThemeColors } from '@theme/types';
import UpdateNovelChapterGroup from './components/UpdateNovelChapterGroup';
import { deleteChapter } from '@database/queries/ChapterQueries';
import { showToast } from '@utils/showToast';
import { backgroundTasks } from '@services/backgroundTasks';
import { UpdateScreenProps } from '@navigators/types';
import { UpdateOverview } from '@database/types';
import { useUpdateContext } from '@components/Context/UpdateContext';
import { formatDate } from '@utils/dateFormat';
import { useFocusEffect } from '@react-navigation/native';

const UpdatesScreen = ({ navigation }: UpdateScreenProps) => {
  const theme = useTheme();
  const { dateFormat = 'default', relativeTimestamps = true } =
    useAppSettings();
  const {
    updatesOverview,
    getUpdates,
    lastUpdateTime,
    showLastUpdateTime,
    error,
  } = useUpdateContext();
  const { searchText, setSearchText, clearSearchbar } = useSearch();
  const onChangeText = useCallback(
    (text: string) => {
      setSearchText(text);
    },
    [setSearchText],
  );

  useFocusEffect(
    useCallback(() => {
      void getUpdates();
    }, [getUpdates]),
  );

  const sections = useMemo(
    () =>
      updatesOverview
        .filter(update =>
          searchText
            ? update.novelName.toLowerCase().includes(searchText.toLowerCase())
            : true,
        )
        .reduce(
          (
            groups: { data: UpdateOverview[]; date: string }[],
            update: UpdateOverview,
          ) => {
            if (
              groups.length === 0 ||
              groups[groups.length - 1]?.date !== update.updateDate
            ) {
              groups.push({ data: [update], date: update.updateDate });
              return groups;
            }
            groups[groups.length - 1]?.data.push(update);
            return groups;
          },
          [],
        ),
    [searchText, updatesOverview],
  );

  const rightIcons = useMemo<RightIcon[]>(
    () => [
      {
        iconName: 'reload',
        onPress: () => backgroundTasks.enqueue({ name: 'UPDATE_LIBRARY' }),
      },
    ],
    [],
  );

  const onRefresh = useCallback(() => {
    backgroundTasks.enqueue({ name: 'UPDATE_LIBRARY' });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: UpdateOverview }) => (
      <UpdateNovelChapterGroup
        onDeleteChapter={chapter => {
          deleteChapter(
            chapter.pluginId,
            chapter.novelId,
            chapter.id,
          ).then(() => {
            showToast(
              getString('common.deleted', {
                name: chapter.name,
              }),
            );
            getUpdates();
          });
        }}
        overview={item}
        chapterCountLabel={getString('updatesScreen.updatesLower')}
      />
    ),
    [getUpdates],
  );

  useEffect(
    () =>
      navigation.addListener('tabPress', e => {
        if (navigation.isFocused()) {
          e.preventDefault();

          navigation.navigate('MoreStack', {
            screen: 'TaskQueue',
          });
        }
      }),
    [navigation],
  );

  return (
    <SafeAreaView excludeBottom>
      <SearchbarV2
        searchText={searchText}
        clearSearchbar={clearSearchbar}
        placeholder={getString('updatesScreen.searchbar')}
        onChangeText={onChangeText}
        leftIcon="magnify"
        theme={theme}
        rightIcons={rightIcons}
      />
      {error ? (
        <ErrorScreenV2 error={error} />
      ) : (
        <SectionList
          ListHeaderComponent={
            showLastUpdateTime && lastUpdateTime ? (
              <LastUpdateTime lastUpdateTime={lastUpdateTime} theme={theme} />
            ) : null
          }
          contentContainerStyle={styles.listContainer}
          renderSectionHeader={({ section: { date } }) => (
            <Text style={[styles.dateHeader, { color: theme.onSurface }]}>
              {formatDate(date, dateFormat, relativeTimestamps)}
            </Text>
          )}
          sections={sections}
          keyExtractor={item =>
            `updatedGroup-${item.novelId}-${item.updateDate}-${item.updatesPerDay}`
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyView
              icon="(˘･_･˘)"
              description={getString('updatesScreen.emptyView')}
              theme={theme}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              colors={[theme.onPrimary]}
              progressBackgroundColor={theme.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default memo(UpdatesScreen);

const LastUpdateTime: React.FC<{
  lastUpdateTime: Date | number | string;
  theme: ThemeColors;
}> = ({ lastUpdateTime, theme }) => (
  <Text style={[styles.lastUpdateTime, { color: theme.onSurface }]}>
    {`${getString('updatesScreen.lastUpdatedAt')} ${dayjs(
      lastUpdateTime,
    ).fromNow()}`}
  </Text>
);

const styles = StyleSheet.create({
  dateHeader: {
    paddingBottom: 2,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  lastUpdateTime: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContainer: {
    flexGrow: 1,
  },
});
