import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import type * as React from "react";
import { MarkdownContent } from "@/features/shared/components/Elements/MarkdownContent";

type AboutPagePresenterProps = {
  sections: Array<{
    slug: string;
    title: string;
    content: string;
  }>;
  locale: string;
};

export const AboutPagePresenter: React.FC<AboutPagePresenterProps> = ({
  sections,
}) => {
  return (
    <Stack direction="column" spacing={2}>
      {sections.map((section) => (
        <Accordion disableGutters key={section.slug}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="span" variant="h5">
              {section.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <MarkdownContent content={section.content} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
};
