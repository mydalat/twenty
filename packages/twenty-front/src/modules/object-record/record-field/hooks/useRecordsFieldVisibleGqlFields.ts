import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { CoreObjectNameSingular } from '@/object-metadata/types/CoreObjectNameSingular';
import { type ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';
import { getImageIdentifierFieldMetadataItem } from '@/object-metadata/utils/getImageIdentifierFieldMetadataItem';
import { getLabelIdentifierFieldMetadataItem } from '@/object-metadata/utils/getLabelIdentifierFieldMetadataItem';
import { hasObjectMetadataItemPositionField } from '@/object-metadata/utils/hasObjectMetadataItemPositionField';
import { generateDepthRecordGqlFieldsFromFields } from '@/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromFields';
import { generateDepthRecordGqlFieldsFromObject } from '@/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromObject';
import { visibleRecordFieldsComponentSelector } from '@/object-record/record-field/states/visibleRecordFieldsComponentSelector';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useRecoilComponentValue } from '@/ui/utilities/state/component-state/hooks/useRecoilComponentValue';
import { isDefined } from 'twenty-shared/utils';

type UseRecordsFieldVisibleGqlFields = {
  objectMetadataItem: ObjectMetadataItem;
  additionalFieldMetadataId?: string | null;
};

export const useRecordsFieldVisibleGqlFields = ({
  objectMetadataItem,
  additionalFieldMetadataId,
}: UseRecordsFieldVisibleGqlFields) => {
  const visibleRecordFields = useRecoilComponentValue(
    visibleRecordFieldsComponentSelector,
  );

  const { fieldMetadataItemByFieldMetadataItemId } =
    useRecordIndexContextOrThrow();

  const { objectMetadataItems } = useObjectMetadataItems();
  const { objectMetadataItem: noteTargetObjectMetadataItem } =
    useObjectMetadataItem({
      objectNameSingular: CoreObjectNameSingular.NoteTarget,
    });

  const { objectMetadataItem: taskTargetObjectMetadataItem } =
    useObjectMetadataItem({
      objectNameSingular: CoreObjectNameSingular.TaskTarget,
    });

  // Generate GraphQL fields for visible fields
  let fieldsToInclude = visibleRecordFields.map(
    (field) =>
      fieldMetadataItemByFieldMetadataItemId[field.fieldMetadataItemId],
  );

  // FORCE INCLUDE assignee field for tasks (even if not visible in table)
  // This ensures relationship data is always fetched for proper display
  if (objectMetadataItem.nameSingular === CoreObjectNameSingular.Task) {
    const assigneeField = objectMetadataItem.fields.find(
      (field) => field.name === 'assignee',
    );

    if (assigneeField && !fieldsToInclude.some((f) => f?.id === assigneeField.id)) {
      fieldsToInclude.push(assigneeField);
    }
  }

  const allDepthOneGqlFields = generateDepthRecordGqlFieldsFromFields({
    objectMetadataItems,
    fields: fieldsToInclude,
    depth: 1,
  });

  const labelIdentifierFieldMetadataItem =
    getLabelIdentifierFieldMetadataItem(objectMetadataItem);
  const imageIdentifierFieldMetadataItem =
    getImageIdentifierFieldMetadataItem(objectMetadataItem);

  const hasPosition = hasObjectMetadataItemPositionField(objectMetadataItem);

  const additionalFieldMetadataItem = isDefined(additionalFieldMetadataId)
    ? fieldMetadataItemByFieldMetadataItemId[additionalFieldMetadataId]
    : undefined;

  return {
    id: true,
    ...(isDefined(additionalFieldMetadataItem)
      ? { [additionalFieldMetadataItem.name]: true }
      : {}),
    ...(isDefined(labelIdentifierFieldMetadataItem)
      ? { [labelIdentifierFieldMetadataItem.name]: true }
      : {}),
    ...(isDefined(imageIdentifierFieldMetadataItem)
      ? { [imageIdentifierFieldMetadataItem.name]: true }
      : {}),
    ...(hasPosition ? { position: true } : {}),
    ...allDepthOneGqlFields,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    noteTargets: generateDepthRecordGqlFieldsFromObject({
      objectMetadataItem: noteTargetObjectMetadataItem,
      objectMetadataItems,
      depth: 1,
    }),
    taskTargets: generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem: taskTargetObjectMetadataItem,
      depth: 1,
    }),
  };
};
