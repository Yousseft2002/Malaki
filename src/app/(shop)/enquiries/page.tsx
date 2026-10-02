import type { Metadata } from "next";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Weddings, events & corporate gifts",
  description: "[META — bespoke MALAKI boxes for weddings, events and corporate gifting]",
  alternates: { canonical: "/enquiries" },
};

type Props = { searchParams: Promise<{ type?: string }> };

export default async function EnquiriesPage({ searchParams }: Props) {
  const { type } = await searchParams;
  return (
    <>
      <section className="bg-emerald py-16 text-ivory md:py-24">
        <div className="container-page">
          <SectionHeading
            as="h1"
            tone="dark"
            eyebrow="Bespoke gifting"
            title="Weddings, events & corporate gifts"
            intro="[GIFTING INTRO — what you offer: favours, custom boxes, branding, minimum order quantities, lead times]"
          />
        </div>
      </section>
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1fr_1.4fr] md:py-24">
        <div className="flex flex-col gap-6">
          <ImagePlaceholder label="[PHOTO: Wedding favour boxes on a reception table]" className="aspect-[4/5] w-full" />
          <p className="text-muted">[GIFTING DETAILS — how the process works, response time, what to include in your enquiry]</p>
        </div>
        <div>
          <h2 className="mb-8 font-display text-3xl text-emerald">Make an enquiry</h2>
          <EnquiryForm defaultType={["WEDDING", "CORPORATE", "EVENT", "OTHER"].includes(type ?? "") ? type : undefined} />
        </div>
      </div>
    </>
  );
}
