import { useEffect, useState } from 'react';
import { ListingDraftStorage } from '../../infrastructure/storage/listing-draft-storage';
import { publishFormShapeSchema, PublishFormValues } from './publish-form-schema';

// Validated against the lenient shape schema, not `publishFormSchema` — a draft is incomplete
// by definition (that's the point of "el borrador se puede retomar"), so it must load back
// even if it wouldn't yet pass the step/submit rules.
const draftStorage = new ListingDraftStorage<PublishFormValues>(publishFormShapeSchema);

interface UsePublishDraft {
  isLoading: boolean;
  initialValues: PublishFormValues | null;
  save: (values: PublishFormValues) => void;
  clear: () => Promise<void>;
}

export function usePublishDraft(): UsePublishDraft {
  const [isLoading, setIsLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<PublishFormValues | null>(null);

  useEffect(() => {
    let cancelled = false;
    draftStorage.load().then((draft) => {
      if (cancelled) return;
      setInitialValues(draft);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isLoading,
    initialValues,
    // Fire-and-forget: losing the very last keystroke to a crash is an acceptable trade for
    // never blocking typing on a disk write.
    save: (values) => void draftStorage.save(values),
    clear: () => draftStorage.clear(),
  };
}
