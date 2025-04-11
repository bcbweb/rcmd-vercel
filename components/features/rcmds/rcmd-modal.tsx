import MetadataPreviewImage from "@/components/common/MetadataPreviewImage";

const MetadataPreviewSection = ({
  metadataImage,
}: {
  metadataImage: string | null;
}) => {
  if (!metadataImage) return null;

  return (
    <div className="aspect-video rounded-md overflow-hidden">
      <MetadataPreviewImage
        src={metadataImage}
        alt="Preview"
        width={600}
        height={400}
        className="object-cover"
      />
    </div>
  );
};

export default MetadataPreviewSection;
