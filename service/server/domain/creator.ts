import { z } from "zod";
import { ChannelSchema } from "./channel";
import { ThumbnailURLSchema } from "./thumbnail";

const MemberTypeSchema = z.enum([
  "vspo_jp",
  "vspo_en",
  "vspo_ch",
  "vspo_all",
  "general",
  "custom",
]);

const CreatorSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    languageCode: z.string().default("default"),
    memberType: MemberTypeSchema,
    thumbnailURL: ThumbnailURLSchema.optional().default(""),
    channel: ChannelSchema.nullable(),
    translated: z.boolean().optional(),
  })
  .transform((creator) => {
    const updatedCreator = { ...creator };

    // If channel has YouTube data, use it for missing fields
    if (creator.channel?.youtube) {
      // Set name from YouTube if not provided
      if (!creator.name && creator.channel.youtube.name) {
        updatedCreator.name = creator.channel.youtube.name;
      }

      // Set thumbnailURL from YouTube if not provided
      if (!creator.thumbnailURL && creator.channel.youtube.thumbnailURL) {
        updatedCreator.thumbnailURL = creator.channel.youtube.thumbnailURL;
      }
    }

    // Ensure name has a value (required field)
    if (!updatedCreator.name) {
      updatedCreator.name = "";
    }

    return updatedCreator;
  });

const CreatorsSchema = z.array(CreatorSchema);

type Creator = z.infer<typeof CreatorSchema>;
type Creators = z.infer<typeof CreatorsSchema>;

const createCreator = (creator: Creator): Creator => {
  return CreatorSchema.parse(creator);
};

const createCreators = (creators: Creators): Creators => {
  return CreatorsSchema.parse(creators);
};

export {
  MemberTypeSchema,
  CreatorSchema,
  CreatorsSchema,
  type Creator,
  type Creators,
  createCreator,
  createCreators,
};
