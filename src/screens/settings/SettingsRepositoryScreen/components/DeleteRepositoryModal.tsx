import React from 'react';

import { ConfirmationDialog } from '@components/index';

import { Repository } from '@database/types';
import { deleteRepositoryById } from '@database/queries/RepositoryQueries';
import { getString } from '@i18n/translations';
interface DeleteRepositoryModalProps {
  repository: Repository;
  visible: boolean;
  closeModal: () => void;
  onSuccess: () => void;
}

const DeleteRepositoryModal: React.FC<DeleteRepositoryModalProps> = ({
  repository,
  closeModal,
  visible,
  onSuccess,
}) => {
  return (
    <ConfirmationDialog
      title={getString('repositories.deleteRepository')}
      confirmLabel={getString('common.delete')}
      message={getString('repositories.deleteRepositoryMessage', {
        url: repository.url,
      })}
      visible={visible}
      onDismiss={closeModal}
      onConfirm={async () => {
        await deleteRepositoryById(repository.id);
        onSuccess();
      }}
    />
  );
};

export default DeleteRepositoryModal;
