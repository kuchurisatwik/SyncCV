import { CenteredHeader, makeClassicTheme, ResumeBody, type TemplateProps } from "../shared";

const theme = makeClassicTheme();

export function Classic({ data }: TemplateProps) {
  return (
    <div className={theme.root} style={theme.rootStyle}>
      <CenteredHeader data={data} />
      <ResumeBody data={data} theme={theme} />
    </div>
  );
}
