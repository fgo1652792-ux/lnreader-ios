import React, { createContext, useMemo, useContext } from 'react';
import {
  useLibrary,
  UseLibraryReturnType,
} from '@screens/library/hooks/useLibrary';
import {
  useLibrarySettings,
} from '@hooks/persisted';
import SetCategoriesModal from '@screens/novel/components/SetCategoriesModal';

// type Library = Category & { novels: LibraryNovelInfo[] };

type LibraryContextType = UseLibraryReturnType & {
  settings: ReturnType<typeof useLibrarySettings>;
};

const EMPTY_NOVEL_IDS: number[] = [];

const defaultValue = {} as LibraryContextType;
const LibraryContext = createContext<LibraryContextType>(defaultValue);

export function LibraryContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const useLibraryParams = useLibrary();
  const rawSettings = useLibrarySettings();
  const {
    pendingLibraryAddition,
    cancelPendingLibraryAddition,
    confirmPendingLibraryAddition,
  } = useLibraryParams;

  // useLibrarySettings() returns a fresh object every render (plain data plus
  // a writer function), which would invalidate the memo below on every render
  // and re-render every consumer of this context. The writer closure only
  // reads the latest MMKV state, so a copy keyed on the serialised settings
  // content is functionally identical while staying referentially stable.
  const settingsKey = JSON.stringify(rawSettings);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on settings content, not identity
  const settings = useMemo(() => ({ ...rawSettings }), [settingsKey]);

  const value = useMemo<LibraryContextType>(
    () => ({ ...useLibraryParams, settings }),
    [useLibraryParams, settings],
  );

  return (
    <>
      <LibraryContext.Provider value={value}>
        {children}
      </LibraryContext.Provider>
      {pendingLibraryAddition ? (
        <SetCategoriesModal
          novelIds={EMPTY_NOVEL_IDS}
          initialCategoryIds={pendingLibraryAddition.initialCategoryIds}
          closeModal={cancelPendingLibraryAddition}
          onSubmit={confirmPendingLibraryAddition}
          visible
        />
      ) : null}
    </>
  );
}

export const useLibraryContext = (): LibraryContextType => {
  return useContext(LibraryContext);
};
